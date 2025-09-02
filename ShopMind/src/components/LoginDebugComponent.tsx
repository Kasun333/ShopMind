import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AuthService } from '../services/authService';
import { AUTH_API_URL } from '../config/apiConfig';

const LoginDebugComponent = () => {
  const [username, setUsername] = useState('Wasantha@123');
  const [password, setPassword] = useState('Wasantha@123');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing login...\n');
    
    try {
      // First, show the URL being used
      const url = `${AUTH_API_URL}/api/auth/login`;
      setResult(prev => prev + `Using URL: ${url}\n`);
      
      // Test the login
      const loginResult = await AuthService.login({ username, password });
      
      setResult(prev => prev + `Result: ${JSON.stringify(loginResult, null, 2)}\n`);
      
      if (loginResult.success) {
        setResult(prev => prev + '✅ Login successful!\n');
      } else {
        setResult(prev => prev + '❌ Login failed!\n');
      }
      
    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testDirectFetch = async () => {
    setLoading(true);
    setResult('Testing direct fetch...\n');
    
    try {
      const url = `${AUTH_API_URL}/api/auth/login`;
      setResult(prev => prev + `Direct fetch URL: ${url}\n`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      setResult(prev => prev + `Response status: ${response.status}\n`);
      setResult(prev => prev + `Response ok: ${response.ok}\n`);
      
      const data = await response.json();
      setResult(prev => prev + `Response data: ${JSON.stringify(data, null, 2)}\n`);
      
    } catch (error) {
      setResult(prev => prev + `❌ Direct fetch error: ${error instanceof Error ? error.message : String(error)}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Login Debug Tool</Text>
      
      <Text style={styles.label}>API URL:</Text>
      <Text style={styles.url}>{AUTH_API_URL}/api/auth/login</Text>
      
      <Text style={styles.label}>Username:</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
      />
      
      <Text style={styles.label}>Password:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Test Login with AuthService</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={testDirectFetch}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Test Direct Fetch</Text>
      </TouchableOpacity>
      
      <Text style={styles.label}>Result:</Text>
      <ScrollView style={styles.resultContainer}>
        <Text style={styles.result}>{result}</Text>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  url: {
    fontSize: 14,
    color: '#0066cc',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultContainer: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    marginTop: 5,
  },
  result: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
});

export default LoginDebugComponent;
