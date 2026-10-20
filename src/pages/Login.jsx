// หน้าล็อกอิน (Module 1): ปุ่ม Google Login -> ส่ง credential ไป POST /auth/google-login
// -> เก็บ JWT token + role ลง localStorage -> navigate ไปหน้าที่ถูกต้องตาม role

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Chip
} from '@mui/material';
import {
  SupervisorAccount as AdminIcon,
  School as StudentIcon,
  ArrowBack as BackIcon,
  Inventory2 as AssetIcon,
  QueryStats as StatsIcon,
  NotificationsActive as NotifyIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config';
import { GoogleLogin } from '@react-oauth/google';

const FEATURES = [
  { icon: <AssetIcon />, text: 'ดูสถานะอุปกรณ์ทั้งหมดจากฐานข้อมูลผ่าน API' },
  { icon: <StatsIcon />, text: 'สรุปภาพรวมการยืม-คืนแยกตามห้องเก็บอุปกรณ์' },
  { icon: <NotifyIcon />, text: 'แอดมินส่งอีเมลแจ้งเตือนรายการเกินกำหนดได้ในคลิกเดียว' }
];

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null); // 'admin' or 'student'

  const handleLogin = async (googleToken) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/google-login`, {
        token: googleToken
      });

      const { access_token, role, name, user_id } = response.data;

      if (selectedRole === 'admin' && role !== 'admin') {
        throw new Error('บัญชีนี้ไม่ได้รับสิทธิ์ผู้ดูแลระบบ กรุณาใช้บัญชีที่ได้รับสิทธิ์ Admin หรือกลับไปเข้าสู่ระบบในฐานะนักศึกษา/บุคลากรแทน');
      }

      localStorage.setItem('token', access_token);
      localStorage.setItem('role', role);
      localStorage.setItem('name', name);
      localStorage.setItem('user_id', user_id);

      navigate(role === 'admin' ? '/' : '/student');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบสิทธิ์บัญชีหรือการเชื่อมต่อเซิร์ฟเวอร์';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        background: '#0f1f3d'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: 1000,
          my: { xs: 0, md: 5 },
          mx: { xs: 0, md: 3 },
          borderRadius: { xs: 0, md: 4 },
          overflow: 'hidden',
          boxShadow: { md: '0 24px 60px rgba(0,0,0,0.35)' }
        }}
      >
        {/* Brand panel */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '46%',
            p: 5,
            color: 'white',
            background: 'linear-gradient(155deg, #1e3c72 0%, #2a5298 60%, #1a73e8 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              top: -120,
              right: -100
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              bottom: -60,
              left: -60
            }}
          />

          <Box sx={{ position: 'relative' }}>
            <Typography variant="overline" sx={{ opacity: 0.75, letterSpacing: 2 }}>
              คณะวิทยาศาสตร์ · มหาวิทยาลัยอุบลราชธานี
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, mb: 1.5 }}>
              DSSI Equipment Borrowing
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85, lineHeight: 1.7 }}>
              ระบบยืม-คืนอุปกรณ์วิทยบริการกลาง สำหรับติดตามอุปกรณ์คอมพิวเตอร์และสื่อดิจิทัลของคณะแบบครบวงจร
            </Typography>
          </Box>

          <Stack spacing={2.5} sx={{ position: 'relative' }}>
            {FEATURES.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {f.icon}
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.92 }}>
                  {f.text}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Typography variant="caption" sx={{ opacity: 0.55, position: 'relative' }}>
            © 2569 คณะวิทยาศาสตร์ มหาวิทยาลัยอุบลราชธานี
          </Typography>
        </Box>

        {/* Login panel */}
        <Box
          sx={{
            width: { xs: '100%', md: '54%' },
            bgcolor: 'background.paper',
            p: { xs: 4, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: { xs: '100vh', md: 'auto' }
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {!selectedRole ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  เข้าสู่ระบบ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  กรุณาเลือกสถานะการใช้งานของคุณเพื่อดำเนินการต่อ
                </Typography>
              </Box>

              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={() => setSelectedRole('student')}
                sx={{
                  py: 2,
                  px: 2.5,
                  borderRadius: 3,
                  borderWidth: 1.5,
                  justifyContent: 'flex-start',
                  gap: 2,
                  '&:hover': { borderWidth: 1.5, bgcolor: 'primary.light' }
                }}
              >
                <StudentIcon sx={{ fontSize: 30, color: 'primary.main' }} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                    นักศึกษา / บุคลากร
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ยืม-คืนอุปกรณ์ และแจ้งซ่อม
                  </Typography>
                </Box>
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={() => setSelectedRole('admin')}
                sx={{
                  py: 2,
                  px: 2.5,
                  borderRadius: 3,
                  borderWidth: 1.5,
                  justifyContent: 'flex-start',
                  gap: 2,
                  '&:hover': { borderWidth: 1.5, bgcolor: 'secondary.light' }
                }}
              >
                <AdminIcon sx={{ fontSize: 30, color: 'secondary.main' }} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                    ผู้ดูแลระบบ
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    แดชบอร์ด ติดตามสถานะ และแจ้งเตือนค้างส่ง
                  </Typography>
                </Box>
              </Button>
            </Stack>
          ) : (
            <Stack spacing={3.5}>
              <Box
                component="button"
                type="button"
                onClick={() => {
                  setSelectedRole(null);
                  setError('');
                }}
                disabled={loading}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  border: 'none',
                  background: 'none',
                  p: 0,
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  color: 'text.secondary',
                  '&:hover': { color: loading ? 'text.secondary' : 'primary.main' }
                }}
              >
                <BackIcon fontSize="small" />
                <Typography variant="body2" component="span" color="inherit">
                  เลือกประเภทผู้ใช้งานใหม่
                </Typography>
              </Box>

              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  เข้าสู่ระบบสำหรับ{selectedRole === 'admin' ? 'ผู้ดูแลระบบ' : 'นักศึกษา/บุคลากร'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ลงชื่อเข้าใช้ด้วยบัญชีมหาวิทยาลัย (@ubu.ac.th)
                </Typography>
              </Box>

              {selectedRole === 'student' ? (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'warning.light',
                    border: '1px solid',
                    borderColor: 'warning.main',
                    textAlign: 'center'
                  }}
                >
                  <Chip
                    label="เร็ว ๆ นี้"
                    color="warning"
                    size="small"
                    sx={{ fontWeight: 700, mb: 1.5 }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    ระบบสำหรับนักศึกษา/บุคลากรอยู่ระหว่างการพัฒนาโดยทีมงานส่วนอื่น
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    กรุณาติดต่อผู้ดูแลระบบหากต้องการยืม-คืนอุปกรณ์ในระหว่างนี้
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', py: 1 }}>
                  {loading ? (
                    <CircularProgress size={36} />
                  ) : (
                    <GoogleLogin
                      onSuccess={(credentialResponse) => {
                        handleLogin(credentialResponse.credential);
                      }}
                      onError={() => {
                        setError('การเข้าสู่ระบบผ่าน Google ล้มเหลว');
                      }}
                    />
                  )}
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
