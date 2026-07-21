import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import { Google as GoogleIcon, SupervisorAccount as AdminIcon, School as StudentIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (mockToken) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/google-login`, {
        token: mockToken
      });
      
      const { access_token, role, name, user_id } = response.data;
      
      // Store in localstorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);
      localStorage.setItem('name', name);
      localStorage.setItem('user_id', user_id);
      
      // Redirect based on role
      if (role === 'admin') {
        navigate('/');
      } else {
        navigate('/student');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'การเข้าสู่ระบบล้มเหลว กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือเซิร์ฟเวอร์'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%', borderRadius: 3, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', py: 4, px: 3, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            DSSI Equipment Borrowing
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            ระบบยืม-คืนอุปกรณ์วิทยบริการ คณะวิทยาศาสตร์
          </Typography>
        </Box>
        
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            <Typography variant="body1" textAlign="center" color="text.secondary">
              ลงชื่อเข้าใช้ด้วยบัญชีมหาวิทยาลัย (@ubu.ac.th)
            </Typography>

            <Box display="flex" justifyContent="center">
              <GoogleLogin
                onSuccess={credentialResponse => {
                  handleLogin(credentialResponse.credential);
                }}
                onError={() => {
                  setError('การเข้าสู่ระบบผ่าน Google ล้มเหลว');
                }}
              />
            </Box>

            <Divider sx={{ my: 1 }}>
              <Typography variant="caption" color="text.secondary">
                ตัวเลือกจำลอง (สำหรับการนำเสนอ)
              </Typography>
            </Divider>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                startIcon={<StudentIcon />}
                onClick={() => handleLogin('mock_student_67114540088')}
                disabled={loading}
                sx={{ py: 1.2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Student Mock
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<AdminIcon />}
                onClick={() => handleLogin('mock_admin_1')}
                disabled={loading}
                sx={{ py: 1.2, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Admin Mock
              </Button>
            </Stack>

            {loading && (
              <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
                <CircularProgress size={30} />
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
