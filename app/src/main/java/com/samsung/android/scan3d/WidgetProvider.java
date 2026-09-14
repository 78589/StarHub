package com.samsung.android.scan3d;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.view.View;
import android.widget.RemoteViews;

import java.io.File;

public class WidgetProvider extends AppWidgetProvider {
    private static final String IMAGE_FILE = "widget_image.png";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) updateWidget(context, manager, id);
    }

    public static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName name = new ComponentName(context, WidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(name);
        for (int id : ids) updateWidget(context, manager, id);
    }

    private static void updateWidget(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_toggle);

        File imageFile = new File(context.getFilesDir(), IMAGE_FILE);
        Bitmap bitmap = imageFile.exists() ? BitmapFactory.decodeFile(imageFile.getAbsolutePath()) : null;
        if (bitmap != null) {
            views.setImageViewBitmap(R.id.widget_image, bitmap);
        } else {
            views.setImageViewResource(R.id.widget_image, android.R.drawable.ic_menu_camera);
        }

        boolean active = context.getSharedPreferences("state", Context.MODE_PRIVATE)
                .getBoolean("active", false);
        views.setViewVisibility(R.id.widget_rec, active ? View.VISIBLE : View.GONE);

        Intent toggle = new Intent(context, RecordingService.class);
        toggle.setAction(RecordingService.ACTION_TOGGLE);
        PendingIntent pi = PendingIntent.getForegroundService(
                context,
                5050,
                toggle,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_root, pi);
        views.setOnClickPendingIntent(R.id.widget_image, pi);
        views.setOnClickPendingIntent(R.id.widget_rec, pi);

        manager.updateAppWidget(widgetId, views);
    }
}
