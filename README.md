# A34 Cam50

Galaxy A34 (SM-A346N)에서 숨겨진 초광각 Camera2 ID `50`을 백그라운드 녹화하기 위한 최소 테스트 앱입니다.

## 설계

- applicationId: `com.samsung.android.scan3d`
- CameraX 사용 안 함
- 카메라 목록 열거 안 함
- `getCameraCharacteristics()` 호출 안 함
- 1차: `CameraManager.openCamera("50")`
- 실패 시 2차: logical camera `23`을 열고 `OutputConfiguration.setPhysicalCameraId("50")`
- 1920x1080 / 30fps / H.264
- Foreground camera service라 홈 화면으로 나가도 녹화 유지
- 파일: `Movies/A34Cam50/`
- 앱 화면 또는 알림의 STOP으로 종료

## 왜 package가 scan3d인가

해당 A34에서 BSG Camera2Test의 `com.samsung.android.scan3d` 변형을 사용할 때 Camera 23/50/54가 노출되는 것이 확인됐기 때문입니다. 동일 package가 이미 설치돼 있으면 서명 충돌로 설치가 실패할 수 있으므로 Camera2Test scan3d 버전은 먼저 삭제하세요.

## 빌드

Android Studio에서 이 폴더를 열고 `app`을 빌드하면 됩니다. 프로젝트는 외부 라이브러리를 사용하지 않습니다.

명령행 Gradle이 있는 경우:

```bash
gradle :app:assembleDebug
```

생성 APK:

```text
app/build/outputs/apk/debug/app-debug.apk
```

## 테스트 순서

1. 기존 `com.samsung.android.scan3d` 앱(Camera2Test 포함)을 삭제합니다.
2. 빌드한 APK 설치.
3. 앱 실행 후 카메라/마이크 권한 허용.
4. `START · Camera 50`.
5. 상태 문구 확인:
   - `Camera 50 열림...`이면 직접 ID 50 성공.
   - 직접 열기 실패 후 `Camera 23 열림...`이면 logical 23 → physical 50 fallback.
6. `● 녹화 중...`이 뜨면 홈으로 나가서 백그라운드 녹화 확인.
7. 앱 또는 알림의 STOP.
8. 갤러리 또는 `Movies/A34Cam50` 확인.

## 주의

이 앱은 A34 한 대를 겨냥한 실험용입니다. Camera ID `23`/`50`은 제조사 비공개 구현 세부사항이라 펌웨어 업데이트로 바뀔 수 있습니다.
