import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { LinearGradient } from 'expo-linear-gradient';

interface LoginWorkerFormData {
  emailOrPhone: string;
  password: string;
}

export default function LoginWorker() {
  const [formData, setFormData] = useState<LoginWorkerFormData>({
    emailOrPhone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof LoginWorkerFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.emailOrPhone || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting login with:', formData.emailOrPhone);

      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.emailOrPhone,
        formData.password
      );

      console.log('Firebase Auth successful, checking worker status...');

      // Check if the user is a worker in Firestore
      const workerDoc = await getDoc(doc(db, 'workers', userCredential.user.uid));
      
      if (!workerDoc.exists()) {
        console.log('Worker document not found');
        Alert.alert('Error', 'This account is not registered as a worker');
        await auth.signOut();
        return;
      }

      const workerData = workerDoc.data();
      console.log('Worker data:', workerData);
      
      // Updated status check to include 'available'
      if (workerData.status !== 'active' && workerData.status !== 'available') {
        console.log('Worker status not valid:', workerData.status);
        Alert.alert(
          'Account Not Active', 
          'Your account is pending approval or has been deactivated. Please contact support.'
        );
        await auth.signOut();
        return;
      }

      console.log('Worker logged in successfully:', userCredential.user.uid);
      console.log('Attempting navigation to worker profile...');
      
      // Use the correct navigation path
      router.replace({
        pathname: '/worker/Profilepage',
        params: { workerId: userCredential.user.uid }
      });

    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to log in';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isEmail = (text: string) => {
    return text.includes('@');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <LinearGradient
        colors={["#9ECAE1", "#C6DBEF"]}
        style={styles.container}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Worker Login</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={formData.emailOrPhone}
              onChangeText={(text) => handleChange('emailOrPhone', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={["#3182BD", "#08519C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={() => router.push('/auth/worker/SignupWorker')}
            disabled={loading}
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupTextBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>

          {/* Temporarily removing Forgot Password until implemented
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push('/auth/worker/ForgotPassword')}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          */}
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#08519C',
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#9ECAE1',
    fontSize: 16,
    color: '#08519C',
  },
  button: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  gradientButton: {
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  signupLink: {
    alignItems: 'center',
    marginBottom: 15,
  },
  signupText: {
    color: '#3182BD',
    fontSize: 14,
  },
  signupTextBold: {
    color: '#08519C',
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#4f46e5',
    fontSize: 14,
  },
});
