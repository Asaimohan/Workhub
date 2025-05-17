import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

type Role = 'user' | 'worker';

export default function Dashboard() {
  const [selectedRole, setSelectedRole] = useState<Role>('user');

  const handleLogin = () => {
    if (selectedRole === 'user') {
      router.push('/auth/user/Login');
    } else {
      router.push('/auth/worker/LoginWorker');
    }
  };

  const handleSignup = () => {
    router.push('/auth/user/Signup');
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#9ECAE1", "#C6DBEF" ]}
        style={styles.gradientBackground}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to WorkHub</Text>
          
          <View style={styles.roleContainer}>
            <Text style={styles.label}>Select Your Role</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedRole}
                onValueChange={(itemValue: Role) => setSelectedRole(itemValue)}
                style={styles.picker}
                dropdownIconColor="white"
              >
                <Picker.Item label="User" value="user" color="#333" />
                <Picker.Item label="Worker" value="worker" color="#333" />
              </Picker>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
            >
              <LinearGradient
                colors={["#3182BD", "#08519C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Log In/Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    minHeight: Dimensions.get('window').height,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  roleContainer: {
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    backdropFilter: 'blur(10px)',
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: 'white',
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  picker: {
    height: 50,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradientButton: {
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
