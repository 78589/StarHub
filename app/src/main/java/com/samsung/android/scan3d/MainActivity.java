package com.samsung.android.scan3d;

import android.Manifest;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final int REQ_PERMS = 1001;

    private TextView status;
    private CheckBox audio;
    private boolean pendingStart;

    private final BroadcastReceiver statusReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String message = intent.getStringExtra(RecordingService.EXTRA_STATUS);
            if (message != null) status.setText(message);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(buildUi());
    }

    private View buildUi() {
        int pad = dp(20);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(pad, pad, pad, pad);
        root.setGravity(Gravity.CENTER_HORIZONTAL);

        TextView title = new TextView(this);
        title.setText("A34 Camera 50 Recorder");
        title.setTextSize(22f);
        title.setPadding(0, 0, 0, dp(16));
        root.addView(title, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT));

        TextView info = new TextView(this);
        info.setText("Galaxy A34 전용 테스트 앱\n직접 Camera ID 50 → 실패 시 Camera 23 + physical 50\n녹화 중 홈으로 나가도 계속 실행됩니다.");
        info.setTextSize(15f);
        info.setPadding(0, 0, 0, dp(16));
        root.addView(info);

        audio = new CheckBox(this);
        audio.setText("마이크 오디오 포함");
        audio.setChecked(true);
        root.addView(audio);

        Button start = new Button(this);
        start.setText("START · Camera 50");
        start.setOnClickListener(v -> requestAndStart());
        root.addView(start, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(58)));

        Button stop = new Button(this);
        stop.setText("STOP");
        stop.setOnClickListener(v -> stopRecorder());
        LinearLayout.LayoutParams stopLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(58));
        stopLp.topMargin = dp(12);
        root.addView(stop, stopLp);

        status = new TextView(this);
        status.setText("대기 중");
        status.setTextSize(14f);
        status.setPadding(0, dp(20), 0, 0);
        root.addView(status, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT));

        return root;
    }

    private void requestAndStart() {
        List<String> needed = new ArrayList<>();
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.CAMERA);
        }
        if (audio.isChecked() && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.RECORD_AUDIO);
        }
        if (Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.POST_NOTIFICATIONS);
        }

        if (!needed.isEmpty()) {
            pendingStart = true;
            requestPermissions(needed.toArray(new String[0]), REQ_PERMS);
            return;
        }
        startRecorder();
    }

    private void startRecorder() {
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            status.setText("카메라 권한이 필요합니다.");
            return;
        }
        boolean withAudio = audio.isChecked() &&
                checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;

        Intent i = new Intent(this, RecordingService.class);
        i.setAction(RecordingService.ACTION_START);
        i.putExtra(RecordingService.EXTRA_AUDIO, withAudio);
        startForegroundService(i);
        status.setText("녹화 시작 요청…");
    }

    private void stopRecorder() {
        Intent i = new Intent(this, RecordingService.class);
        i.setAction(RecordingService.ACTION_STOP);
        startService(i);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_PERMS && pendingStart) {
            pendingStart = false;
            startRecorder();
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        IntentFilter f = new IntentFilter(RecordingService.ACTION_STATUS);
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(statusReceiver, f, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(statusReceiver, f);
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
        try {
            unregisterReceiver(statusReceiver);
        } catch (IllegalArgumentException ignored) {
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
