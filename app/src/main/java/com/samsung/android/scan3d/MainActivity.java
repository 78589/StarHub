package com.samsung.android.scan3d;

import android.Manifest;
import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final int REQ_PERMS = 1001;
    private static final int REQ_IMAGE = 1002;
    private static final String IMAGE_FILE = "widget_image.png";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(buildUi());
        requestNeededPermissions();
    }

    private LinearLayout buildUi() {
        int pad = dp(20);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(pad, pad, pad, pad);
        root.setGravity(Gravity.CENTER_HORIZONTAL);

        TextView title = new TextView(this);
        title.setText("A34 Cam50 Widget");
        title.setTextSize(22f);
        title.setPadding(0, 0, 0, dp(12));
        root.addView(title);

        TextView info = new TextView(this);
        info.setText("초기 설정용 화면입니다.\n홈 화면 위젯을 한 번 누르면 녹화 시작, 다시 누르면 중지됩니다.\n녹화 중에는 시스템 알림과 위젯의 REC 표시가 유지됩니다.");
        info.setTextSize(15f);
        info.setPadding(0, 0, 0, dp(18));
        root.addView(info);

        Button image = new Button(this);
        image.setText("위젯 사진 선택");
        image.setOnClickListener(v -> chooseImage());
        root.addView(image, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(58)));

        Button pin = new Button(this);
        pin.setText("홈 화면에 위젯 추가");
        pin.setOnClickListener(v -> pinWidget());
        LinearLayout.LayoutParams pinLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(58));
        pinLp.topMargin = dp(12);
        root.addView(pin, pinLp);

        return root;
    }

    private void requestNeededPermissions() {
        List<String> needed = new ArrayList<>();
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.CAMERA);
        }
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.RECORD_AUDIO);
        }
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        if (!needed.isEmpty()) requestPermissions(needed.toArray(new String[0]), REQ_PERMS);
    }

    private void chooseImage() {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType("image/*");
        startActivityForResult(i, REQ_IMAGE);
    }

    private void pinWidget() {
        AppWidgetManager manager = AppWidgetManager.getInstance(this);
        ComponentName provider = new ComponentName(this, WidgetProvider.class);
        if (Build.VERSION.SDK_INT >= 26 && manager.isRequestPinAppWidgetSupported()) {
            manager.requestPinAppWidget(provider, null, null);
        } else {
            Toast.makeText(this, "홈 화면을 길게 눌러 위젯에서 A34 Cam50을 추가하세요.", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_IMAGE && resultCode == RESULT_OK && data != null && data.getData() != null) {
            try (InputStream in = getContentResolver().openInputStream(data.getData())) {
                Bitmap src = BitmapFactory.decodeStream(in);
                if (src == null) throw new IllegalArgumentException("이미지를 읽을 수 없습니다.");
                Bitmap square = centerCrop(src, 512);
                File file = new File(getFilesDir(), IMAGE_FILE);
                try (FileOutputStream out = new FileOutputStream(file)) {
                    square.compress(Bitmap.CompressFormat.PNG, 95, out);
                }
                if (square != src) square.recycle();
                src.recycle();
                WidgetProvider.updateAll(this);
                Toast.makeText(this, "위젯 사진이 변경됐습니다.", Toast.LENGTH_SHORT).show();
            } catch (Throwable t) {
                Toast.makeText(this, "사진 변경 실패: " + t.getClass().getSimpleName(), Toast.LENGTH_LONG).show();
            }
        }
    }

    private Bitmap centerCrop(Bitmap src, int size) {
        int w = src.getWidth();
        int h = src.getHeight();
        int side = Math.min(w, h);
        int left = (w - side) / 2;
        int top = (h - side) / 2;
        Bitmap out = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(out);
        Rect from = new Rect(left, top, left + side, top + side);
        Rect to = new Rect(0, 0, size, size);
        c.drawBitmap(src, from, to, null);
        return out;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
