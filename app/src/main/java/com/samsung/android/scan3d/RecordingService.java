package com.samsung.android.scan3d;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.params.OutputConfiguration;
import android.hardware.camera2.params.SessionConfiguration;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.ParcelFileDescriptor;
import android.os.PowerManager;
import android.provider.MediaStore;
import android.util.Log;
import android.util.Range;
import android.view.Surface;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicBoolean;

public class RecordingService extends Service {
    public static final String ACTION_START = "com.samsung.android.scan3d.START";
    public static final String ACTION_STOP = "com.samsung.android.scan3d.STOP";
    public static final String ACTION_STATUS = "com.samsung.android.scan3d.STATUS";
    public static final String EXTRA_AUDIO = "audio";
    public static final String EXTRA_STATUS = "status";

    private static final String TAG = "A34Cam50";
    private static final String CHANNEL_ID = "recording";
    private static final int NOTIFICATION_ID = 50;
    private static final String DIRECT_ID = "50";
    private static final String LOGICAL_ID = "23";
    private static final String PHYSICAL_ID = "50";

    private HandlerThread cameraThread;
    private Handler cameraHandler;
    private Executor cameraExecutor;
    private CameraDevice camera;
    private CameraCaptureSession session;
    private MediaRecorder recorder;
    private ParcelFileDescriptor outputPfd;
    private Uri outputUri;
    private PowerManager.WakeLock wakeLock;

    private volatile boolean recording;
    private volatile boolean starting;
    private boolean withAudio;
    private boolean usingLogicalFallback;
    private final AtomicBoolean fallbackStarted = new AtomicBoolean(false);

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        cameraThread = new HandlerThread("A34Cam50-Camera");
        cameraThread.start();
        cameraHandler = new Handler(cameraThread.getLooper());
        cameraExecutor = command -> cameraHandler.post(command);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;
        String action = intent.getAction();

        if (ACTION_STOP.equals(action)) {
            cameraHandler.post(this::stopRecordingInternal);
            return START_NOT_STICKY;
        }

        if (ACTION_START.equals(action)) {
            if (starting || recording) {
                sendStatus("이미 녹화 중입니다.");
                return START_NOT_STICKY;
            }
            withAudio = intent.getBooleanExtra(EXTRA_AUDIO, true)
                    && checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;

            int type = ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA;
            if (withAudio) type |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE;
            if (Build.VERSION.SDK_INT >= 29) {
                startForeground(NOTIFICATION_ID, buildNotification("카메라 시작 중…"), type);
            } else {
                startForeground(NOTIFICATION_ID, buildNotification("카메라 시작 중…"));
            }

            acquireWakeLock();
            starting = true;
            fallbackStarted.set(false);
            cameraHandler.post(this::openDirectCamera50);
        }
        return START_NOT_STICKY;
    }

    private void openDirectCamera50() {
        usingLogicalFallback = false;
        sendStatus("Camera 50 직접 열기…");
        Log.i(TAG, "Trying direct Camera ID 50");
        try {
            CameraManager cm = getSystemService(CameraManager.class);
            if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                fail("카메라 권한 없음", null);
                return;
            }
            cm.openCamera(DIRECT_ID, directCallback, cameraHandler);
        } catch (Throwable t) {
            Log.w(TAG, "Direct openCamera(50) failed", t);
            startLogicalFallback("직접 Camera 50 열기 실패: " + shortError(t));
        }
    }

    private final CameraDevice.StateCallback directCallback = new CameraDevice.StateCallback() {
        @Override
        public void onOpened(CameraDevice cameraDevice) {
            camera = cameraDevice;
            sendStatus("Camera 50 열림. 녹화 세션 구성…");
            configureRecorderAndSession(false);
        }

        @Override
        public void onDisconnected(CameraDevice cameraDevice) {
            cameraDevice.close();
            if (!recording) startLogicalFallback("Camera 50 연결 끊김");
        }

        @Override
        public void onError(CameraDevice cameraDevice, int error) {
            cameraDevice.close();
            if (!recording) startLogicalFallback("Camera 50 open error=" + error);
        }
    };

    private void startLogicalFallback(String reason) {
        if (!fallbackStarted.compareAndSet(false, true)) {
            if (!recording) fail("Camera 50/23 모두 실패", null);
            return;
        }
        Log.w(TAG, "Falling back to logical 23 + physical 50. Reason: " + reason);
        sendStatus(reason + "\n→ Camera 23 + physical 50 시도…");
        releaseRecorder(false);
        closeCameraOnly();
        finalizeOutput(false);
        usingLogicalFallback = true;
        try {
            CameraManager cm = getSystemService(CameraManager.class);
            if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                fail("카메라 권한 없음", null);
                return;
            }
            cm.openCamera(LOGICAL_ID, logicalCallback, cameraHandler);
        } catch (Throwable t) {
            fail("Camera 23 열기 실패: " + shortError(t), t);
        }
    }

    private final CameraDevice.StateCallback logicalCallback = new CameraDevice.StateCallback() {
        @Override
        public void onOpened(CameraDevice cameraDevice) {
            camera = cameraDevice;
            sendStatus("Camera 23 열림. physical 50 세션 구성…");
            configureRecorderAndSession(true);
        }

        @Override
        public void onDisconnected(CameraDevice cameraDevice) {
            cameraDevice.close();
            fail("Camera 23 연결 끊김", null);
        }

        @Override
        public void onError(CameraDevice cameraDevice, int error) {
            cameraDevice.close();
            fail("Camera 23 open error=" + error, null);
        }
    };

    private void configureRecorderAndSession(boolean physical50) {
        try {
            prepareRecorder();
            Surface recorderSurface = recorder.getSurface();
            OutputConfiguration output = new OutputConfiguration(recorderSurface);
            if (physical50) {
                output.setPhysicalCameraId(PHYSICAL_ID);
            }

            SessionConfiguration config = new SessionConfiguration(
                    SessionConfiguration.SESSION_REGULAR,
                    Collections.singletonList(output),
                    cameraExecutor,
                    new CameraCaptureSession.StateCallback() {
                        @Override
                        public void onConfigured(CameraCaptureSession captureSession) {
                            session = captureSession;
                            beginCapture(recorderSurface);
                        }

                        @Override
                        public void onConfigureFailed(CameraCaptureSession captureSession) {
                            if (!physical50 && !recording) {
                                releaseRecorder(false);
                                startLogicalFallback("Camera 50 capture session 구성 실패");
                            } else {
                                fail("physical 50 capture session 구성 실패", null);
                            }
                        }
                    });
            camera.createCaptureSession(config);
        } catch (Throwable t) {
            if (!physical50 && !recording) {
                releaseRecorder(false);
                startLogicalFallback("Camera 50 세션 예외: " + shortError(t));
            } else {
                fail("physical 50 세션 예외: " + shortError(t), t);
            }
        }
    }

    private void beginCapture(Surface recorderSurface) {
        try {
            CaptureRequest.Builder builder = camera.createCaptureRequest(CameraDevice.TEMPLATE_RECORD);
            builder.addTarget(recorderSurface);
            builder.set(CaptureRequest.CONTROL_MODE, CaptureRequest.CONTROL_MODE_AUTO);
            builder.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, new Range<>(30, 30));
            session.setRepeatingRequest(builder.build(), null, cameraHandler);
            recorder.start();
            recording = true;
            starting = false;
            String mode = usingLogicalFallback ? "Camera 23 → physical 50" : "Camera 50 직접";
            String msg = "● 녹화 중 · " + mode + " · 1080p30" + (withAudio ? " + audio" : "");
            sendStatus(msg);
            updateNotification(msg);
            Log.i(TAG, msg);
        } catch (Throwable t) {
            if (!usingLogicalFallback) {
                releaseRecorder(false);
                startLogicalFallback("Camera 50 녹화 시작 실패: " + shortError(t));
            } else {
                fail("녹화 시작 실패: " + shortError(t), t);
            }
        }
    }

    private void prepareRecorder() throws IOException {
        createOutputDestination();

        recorder = Build.VERSION.SDK_INT >= 31 ? new MediaRecorder(this) : new MediaRecorder();
        if (withAudio) recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
        recorder.setVideoSource(MediaRecorder.VideoSource.SURFACE);
        recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
        recorder.setVideoEncoder(MediaRecorder.VideoEncoder.H264);
        recorder.setVideoEncodingBitRate(12_000_000);
        recorder.setVideoFrameRate(30);
        recorder.setVideoSize(1920, 1080);
        recorder.setOrientationHint(90);
        if (withAudio) {
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.setAudioEncodingBitRate(128_000);
            recorder.setAudioSamplingRate(48_000);
        }
        recorder.setOutputFile(outputPfd.getFileDescriptor());
        recorder.prepare();
    }

    private void createOutputDestination() throws IOException {
        String name = "A34Cam50_" + new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date()) + ".mp4";
        ContentResolver resolver = getContentResolver();

        if (Build.VERSION.SDK_INT >= 29) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Video.Media.DISPLAY_NAME, name);
            values.put(MediaStore.Video.Media.MIME_TYPE, "video/mp4");
            values.put(MediaStore.Video.Media.RELATIVE_PATH, "Movies/A34Cam50");
            values.put(MediaStore.Video.Media.IS_PENDING, 1);
            outputUri = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values);
            if (outputUri == null) throw new IOException("MediaStore insert failed");
            outputPfd = resolver.openFileDescriptor(outputUri, "w");
            if (outputPfd == null) throw new IOException("openFileDescriptor failed");
        } else {
            File dir = new File(getExternalFilesDir(null), "A34Cam50");
            if (!dir.exists() && !dir.mkdirs()) throw new IOException("Cannot create output dir");
            File file = new File(dir, name);
            outputUri = Uri.fromFile(file);
            outputPfd = ParcelFileDescriptor.open(file,
                    ParcelFileDescriptor.MODE_CREATE | ParcelFileDescriptor.MODE_WRITE_ONLY | ParcelFileDescriptor.MODE_TRUNCATE);
        }
    }

    private void stopRecordingInternal() {
        boolean hadRecording = recording;
        starting = false;
        recording = false;
        sendStatus("녹화 종료 중…");

        try {
            if (session != null) {
                try { session.stopRepeating(); } catch (Throwable ignored) {}
                try { session.abortCaptures(); } catch (Throwable ignored) {}
            }
        } finally {
            releaseRecorder(hadRecording);
            closeCameraOnly();
            finalizeOutput(hadRecording);
            releaseWakeLock();
            sendStatus(hadRecording ? "저장 완료: Movies/A34Cam50" : "중지됨");
            stopForeground(STOP_FOREGROUND_REMOVE);
            stopSelf();
        }
    }

    private void releaseRecorder(boolean callStop) {
        if (recorder != null) {
            if (callStop) {
                try { recorder.stop(); } catch (RuntimeException e) { Log.w(TAG, "recorder.stop failed", e); }
            }
            try { recorder.reset(); } catch (Throwable ignored) {}
            try { recorder.release(); } catch (Throwable ignored) {}
            recorder = null;
        }
    }

    private void closeCameraOnly() {
        if (session != null) {
            try { session.close(); } catch (Throwable ignored) {}
            session = null;
        }
        if (camera != null) {
            try { camera.close(); } catch (Throwable ignored) {}
            camera = null;
        }
    }

    private void finalizeOutput(boolean keep) {
        try {
            if (outputPfd != null) outputPfd.close();
        } catch (IOException ignored) {
        }
        outputPfd = null;

        if (outputUri != null) {
            ContentResolver resolver = getContentResolver();
            try {
                if (keep) {
                    if (Build.VERSION.SDK_INT >= 29) {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.Video.Media.IS_PENDING, 0);
                        resolver.update(outputUri, values, null, null);
                    }
                } else {
                    resolver.delete(outputUri, null, null);
                }
            } catch (Throwable t) {
                Log.w(TAG, "finalize output failed", t);
            }
        }
        outputUri = null;
    }

    private void fail(String message, Throwable t) {
        if (t != null) Log.e(TAG, message, t); else Log.e(TAG, message);
        sendStatus("실패: " + message);
        starting = false;
        recording = false;
        releaseRecorder(false);
        closeCameraOnly();
        finalizeOutput(false);
        releaseWakeLock();
        updateNotification("실패: " + message);
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    private String shortError(Throwable t) {
        String m = t.getMessage();
        return t.getClass().getSimpleName() + (m == null ? "" : " · " + m);
    }

    private void sendStatus(String message) {
        Log.i(TAG, message);
        getSharedPreferences("state", MODE_PRIVATE).edit().putString("last_status", message).apply();
        Intent i = new Intent(ACTION_STATUS);
        i.setPackage(getPackageName());
        i.putExtra(EXTRA_STATUS, message);
        sendBroadcast(i);
    }

    private void createChannel() {
        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Camera recording",
                NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("A34 Camera 50 background recording");
        getSystemService(NotificationManager.class).createNotificationChannel(channel);
    }

    private Notification buildNotification(String text) {
        Intent openIntent = new Intent(this, MainActivity.class);
        PendingIntent openPi = PendingIntent.getActivity(
                this, 1, openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent stopIntent = new Intent(this, RecordingService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(
                this, 2, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("A34 Cam50")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.presence_video_online)
                .setOngoing(true)
                .setContentIntent(openPi)
                .addAction(new Notification.Action.Builder(
                        android.R.drawable.ic_media_pause,
                        "STOP",
                        stopPi).build())
                .build();
    }

    private void updateNotification(String text) {
        getSystemService(NotificationManager.class).notify(NOTIFICATION_ID, buildNotification(text));
    }

    private void acquireWakeLock() {
        if (wakeLock == null) {
            PowerManager pm = getSystemService(PowerManager.class);
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "A34Cam50:record");
            wakeLock.setReferenceCounted(false);
        }
        if (!wakeLock.isHeld()) wakeLock.acquire(4 * 60 * 60 * 1000L);
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }

    @Override
    public void onDestroy() {
        if (recording || starting) {
            if (cameraHandler != null) cameraHandler.post(this::stopRecordingInternal);
        }
        if (cameraThread != null) {
            cameraThread.quitSafely();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
