// app/(tabs)/create.jsx
import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useGlobalContext } from "../../context/GlobalProvider";
import { uploadFile, createVideo } from "../../lib/appwrite";
import FormField from "../../components/FormField";
import CustomButton from "../../components/CustomButton";
import icons from "../../constants/icons";

/**
 * Create Screen Component
 */
function Create() {
  const { user } = useGlobalContext();
  
  // Form state
  const [form, setForm] = useState({
    title: "",
    video: null,
    thumbnail: null,
    prompt: "",
  });
  
  // Loading and uploading states
  const [uploading, setUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = React.useRef(null);

  /**
   * Open file picker for video or image selection
   * @param {string} selectType - 'video' or 'image'
   */
  const openPicker = async (selectType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: selectType === "image" 
          ? ["image/png", "image/jpg", "image/jpeg"]
          : ["video/mp4", "video/gif", "video/mov"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        if (selectType === "image") {
          setForm({
            ...form,
            thumbnail: asset,
          });
        } else if (selectType === "video") {
          setForm({
            ...form,
            video: asset,
          });
        }
      }
    } catch (error) {
      Alert.alert("Error", `Failed to pick ${selectType}: ${error.message}`);
    }
  };

  /**
   * Toggle video playback
   */
  const togglePlayback = async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.log("Playback error:", error);
    }
  };

  /**
   * Submit and upload the video with metadata
   */
  const submit = async () => {
    // Validation
    if (!form.title || !form.video || !form.thumbnail || !form.prompt) {
      return Alert.alert(
        "Missing Information",
        "Please fill in all required fields (title, video, thumbnail, and AI prompt)"
      );
    }

    if (!user?.id) {
      return Alert.alert("Error", "You must be logged in to upload videos");
    }

    setUploading(true);

    try {
      // Upload video file to storage
      console.log("Uploading video...");
      const videoUrl = await uploadFile(form.video, "video");

      // Upload thumbnail file to storage
      console.log("Uploading thumbnail...");
      const thumbnailUrl = await uploadFile(form.thumbnail, "image");

      // Create video record in database
      console.log("Creating video record...");
      await createVideo({
        title: form.title,
        videoUrl,
        thumbnailUrl,
        prompt: form.prompt,
        creator: user.id,
      });

      // Show success alert FIRST (before clearing form)
      if (Platform.OS === 'web') {
        const goToHome = window.confirm("Success! 🎉\n\nYour video has been uploaded successfully!\n\nClick OK to view on Home tab, or Cancel to upload another video.");
        
        // Reset form
        setForm({
          title: "",
          video: null,
          thumbnail: null,
          prompt: "",
        });
        setIsPlaying(false);
        
        // Navigate to home if user clicked OK
        if (goToHome) {
          router.push("/home");
        }
      } else {
        Alert.alert(
          "Success!", 
          "Your video has been uploaded successfully!",
          [
            {
              text: "View on Home",
              onPress: () => {
                // Reset form
                setForm({
                  title: "",
                  video: null,
                  thumbnail: null,
                  prompt: "",
                });
                setIsPlaying(false);
                // Navigate to home
                router.push("/home");
              }
            },
            {
              text: "Upload Another",
              onPress: () => {
                // Reset form
                setForm({
                  title: "",
                  video: null,
                  thumbnail: null,
                  prompt: "",
                });
                setIsPlaying(false);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      
      // Better error messages
      let errorMessage = "Something went wrong while uploading your video";
      
      if (error.message?.includes("Bucket not found")) {
        errorMessage = "Please set up Supabase Storage buckets first:\n\n1. Create 'videos' bucket (PUBLIC)\n2. Create 'images' bucket (PUBLIC)\n\nSee README.md for detailed instructions.";
      } else if (error.message?.includes("videos")) {
        errorMessage = "Please create the 'videos' table in Supabase first. See README.md for the SQL schema.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert("Upload Failed", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload Video</Text>
          <Text style={styles.subtitle}>
            Share your creativity with the world
          </Text>
        </View>

        {/* Video Title Input */}
        <FormField
          title="Video Title"
          value={form.title}
          placeholder="Give your video a catchy title..."
          handleChangeText={(e) => setForm({ ...form, title: e })}
          otherStyles={styles.formField}
        />

        {/* Video Upload Section */}
        <View style={styles.uploadSection}>
          <Text style={styles.label}>Upload Video</Text>

          {form.video ? (
            <View style={styles.uploadButton}>
              <View style={styles.mediaContainer}>
                <Video
                  ref={videoRef}
                  source={{ uri: form.video.uri }}
                  style={styles.videoPreview}
                  resizeMode={ResizeMode.CONTAIN}
                  videoStyle={styles.videoStyle}
                  isLooping
                  shouldPlay={false}
                  onPlaybackStatusUpdate={(status) => {
                    if (status.isLoaded) {
                      setIsPlaying(status.isPlaying);
                    }
                  }}
                />
                
                {/* Play/Pause Button Overlay */}
                {!isPlaying && (
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={togglePlayback}
                  >
                    <View style={styles.playButtonInner}>
                      <Text style={styles.playButtonIcon}>▶</Text>
                    </View>
                  </TouchableOpacity>
                )}
                
                {/* Tap to Pause when playing */}
                {isPlaying && (
                  <TouchableOpacity
                    style={styles.pauseOverlay}
                    onPress={togglePlayback}
                  />
                )}
                
                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    setForm({ ...form, video: null });
                    setIsPlaying(false);
                  }}
                  disabled={uploading}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => openPicker("video")}
              disabled={uploading}
            >
              <View style={styles.uploadPlaceholder}>
                <View style={styles.uploadIconContainer}>
                  <Image
                    source={icons.upload}
                    style={styles.uploadIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.uploadText}>Choose a video to upload</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Thumbnail Upload Section */}
        <View style={styles.uploadSection}>
          <Text style={styles.label}>Thumbnail Image</Text>

          {form.thumbnail ? (
            <View style={styles.thumbnailButton}>
              <View style={styles.mediaContainer}>
                <Image
                  source={{ uri: form.thumbnail.uri }}
                  style={styles.thumbnailPreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => setForm({ ...form, thumbnail: null })}
                  disabled={uploading}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.thumbnailButton}
              onPress={() => openPicker("image")}
              disabled={uploading}
            >
              <View style={styles.thumbnailPlaceholder}>
                <View style={styles.uploadIconContainer}>
                  <Image
                    source={icons.upload}
                    style={styles.uploadIconSmall}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.uploadTextSmall}>Choose a thumbnail</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* AI Prompt Input */}
        <FormField
          title="AI Prompt"
          value={form.prompt}
          placeholder="The AI prompt you used to create this video..."
          handleChangeText={(e) => setForm({ ...form, prompt: e })}
          otherStyles={styles.formField}
          multiline
        />

        {/* Submit Button */}
        <CustomButton
          title={uploading ? "Publishing..." : "Submit & Publish"}
          handlePress={submit}
          containerStyles={styles.submitButton}
          isLoading={uploading}
        />

        {/* Loading Indicator */}
        {uploading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FF9C01" />
            <Text style={styles.loadingText}>Uploading your video...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default Create;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 38,
    fontWeight: "900",
    color: "#F8FAFC",
    marginBottom: 8,
    letterSpacing: -1,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  formField: {
    marginBottom: 28,
  },
  uploadSection: {
    marginBottom: 28,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F1F5F9",
    marginBottom: 20,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    fontSize: 13,
  },
  uploadButton: {
    width: "100%",
    height: 280,
    borderRadius: 24,
    backgroundColor: "#0F172A",
    borderWidth: 2,
    borderColor: "#1E293B",
    ...Platform.select({
      web: {
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
      },
    }),
  },
  mediaContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 24,
    overflow: "hidden",
  },
  videoPreview: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  videoStyle: {
    width: "100%",
    height: "100%",
  },
  deleteButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
        transition: "all 0.2s ease",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 6,
      },
    }),
  },
  deleteButtonText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 22,
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -40 }, { translateY: -40 }],
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  playButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 156, 1, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 8px 32px rgba(255, 156, 1, 0.5), 0 0 0 4px rgba(255, 156, 1, 0.2)",
        transition: "all 0.2s ease",
      },
      default: {
        shadowColor: "#FF9C01",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 10,
      },
    }),
  },
  playButtonIcon: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    marginLeft: 4,
  },
  pauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 20,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255, 156, 1, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(255, 156, 1, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 0 30px rgba(255, 156, 1, 0.15)",
      },
      default: {
        shadowColor: "#FF9C01",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  uploadIcon: {
    width: 36,
    height: 36,
    tintColor: "#FF9C01",
  },
  uploadText: {
    fontSize: 16,
    color: "#CBD5E1",
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  thumbnailButton: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    backgroundColor: "#0F172A",
    borderWidth: 2,
    borderColor: "#1E293B",
    ...Platform.select({
      web: {
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 10,
      },
    }),
  },
  thumbnailPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  uploadIconSmall: {
    width: 32,
    height: 32,
    tintColor: "#FF9C01",
  },
  uploadTextSmall: {
    fontSize: 15,
    color: "#CBD5E1",
    fontWeight: "500",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  submitButton: {
    marginTop: 40,
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255, 156, 1, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 156, 1, 0.1)",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 15,
    color: "#FF9C01",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
