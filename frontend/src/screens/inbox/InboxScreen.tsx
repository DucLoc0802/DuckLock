import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppScreen } from '@/components/ui/AppScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/src/store/app-store';
import { colors, radius, spacing } from '@/src/theme/tokens';
import { formatTime } from '@/src/utils/format';

export function InboxScreen() {
  const { proofImages } = useAppStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  // Trạng thái cục bộ
  const [isCameraOpen, setIsCameraOpen] = useState(true); // Mặc định mở camera khi vào tab "Thêm"
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isCapturing, setIsCapturing] = useState(false);

  // 1. Kiểm tra và yêu cầu quyền sử dụng Camera
  if (isCameraOpen) {
    if (!permission) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <AppScreen>
          <AppHeader title="Quyền truy cập" subtitle="Cần quyền Camera để chụp chi tiêu" />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg, padding: spacing.xl }}>
            <Ionicons name="camera-outline" size={80} color={colors.textMuted} />
            <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 16 }}>
              Vui lòng cấp quyền truy cập Camera để ứng dụng có thể chụp sản phẩm hoặc dịch vụ bạn đã mua.
            </Text>
            <TouchableOpacity
              onPress={requestPermission}
              style={{
                backgroundColor: '#10B981',
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                borderRadius: radius.pill,
              }}
            >
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>Cấp quyền ngay</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setIsCameraOpen(false)} style={{ marginTop: spacing.sm }}>
              <Text style={{ color: colors.textMuted, textDecorationLine: 'underline' }}>
                Xem danh sách ảnh đã chụp
              </Text>
            </TouchableOpacity>
          </View>
        </AppScreen>
      );
    }
  }

  // 2. Xử lý chụp ảnh và chuyển tiếp sang Form Nhập Giao Dịch
  async function handleCapture() {
    if (!cameraRef.current) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        // Chuyển hướng trực tiếp sang Form Thêm giao dịch (add-transaction) kèm theo ảnh vừa chụp
        router.push({
          pathname: '/add-transaction',
          params: { imageUri: photo.uri },
        });
      }
    } catch (error: any) {
      console.error('Lỗi khi chụp ảnh:', error);
      Alert.alert('Lỗi', error.message || 'Không thể chụp ảnh');
    } finally {
      setIsCapturing(false);
    }
  }

  // MÀN HÌNH KHUNG CHỤP ẢNH TÙY CHỈNH (CUSTOM CAMERA VIEWPORT)
  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          ref={cameraRef}
          facing="back"
          flash={flash}
        >
          <View style={styles.cameraOverlay}>
            
            {/* Top Bar: Nút đóng camera & Nút Flash */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                onPress={() => setIsCameraOpen(false)}
                style={styles.circleIconButton}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
              
              <Text style={styles.cameraTitle}>Chụp Chi Tiêu</Text>
              
              <TouchableOpacity
                onPress={() => setFlash((current) => (current === 'off' ? 'on' : 'off'))}
                style={styles.circleIconButton}
              >
                <Ionicons
                  name={flash === 'on' ? 'flash' : 'flash-off'}
                  size={22}
                  color={flash === 'on' ? '#FFD966' : colors.white}
                />
              </TouchableOpacity>
            </View>

            {/* Center: Khung ngắm đứt nét */}
            <View style={styles.viewfinderContainer}>
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <Text style={styles.viewfinderText}>Chụp món đồ / ly nước / hóa đơn đã mua</Text>
              </View>
            </View>

            {/* Bottom Controls: Nút chụp ảnh */}
            <View style={styles.cameraFooter}>
              <TouchableOpacity
                onPress={() => setIsCameraOpen(false)}
                style={styles.listPreviewButton}
              >
                {proofImages.length > 0 ? (
                  <Image
                    source={{ uri: proofImages[0].imageUri }}
                    style={styles.listPreviewImage}
                  />
                ) : (
                  <Ionicons name="images-outline" size={24} color={colors.white} />
                )}
                {proofImages.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{proofImages.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCapture}
                disabled={isCapturing}
                style={styles.captureButton}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={{ width: 50 }} />
            </View>

          </View>
        </CameraView>

        {isCapturing && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.uploadingText}>Đang chụp ảnh...</Text>
          </View>
        )}
      </View>
    );
  }

  // MÀN HÌNH DANH SÁCH HÀNG CHỜ XỬ LÝ (QUEUE LIST)
  return (
    <AppScreen scrollable>
      <AppHeader
        title={`Hàng chờ (${proofImages.length})`}
        subtitle="Ảnh minh chứng đang chờ hệ thống xử lý"
      />
      
      {/* Nút mở lại camera */}
      <TouchableOpacity
        onPress={() => setIsCameraOpen(true)}
        style={styles.openCameraButton}
      >
        <Ionicons name="camera" size={20} color={colors.white} />
        <Text style={styles.openCameraButtonText}>Mở Camera Chụp Thêm</Text>
      </TouchableOpacity>

      {proofImages.length === 0 ? (
        <EmptyState
          title="Không có ảnh nào"
          description="Bấm mở Camera chụp ảnh hóa đơn để bắt đầu quét chi tiêu."
        />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md }}>
          {proofImages.map((item) => (
            <View key={item.id} style={styles.imageCard}>
              <Image
                source={{ uri: item.imageUri }}
                style={{ width: '100%', height: 170 }}
                contentFit="cover"
              />
              <View style={{ padding: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.pendingDot} />
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Đang chờ xử lý</Text>
                </View>
                <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 12 }}>
                  {formatTime(item.capturedAt)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  circleIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  viewfinder: {
    width: '100%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#10B981', // Màu viền xanh lá neon
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  viewfinderText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '700',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    textAlign: 'center',
  },
  cameraFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  listPreviewButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  listPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4D4D',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#10B981',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  uploadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  openCameraButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  openCameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  imageCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFAD33', // Màu cam cảnh báo đang chờ xử lý
  },
});
