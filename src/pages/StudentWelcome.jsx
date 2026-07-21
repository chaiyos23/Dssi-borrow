import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Avatar,
  Stack,
  Divider
} from '@mui/material';
import { Logout as LogoutIcon, School as StudentIcon } from '@mui/icons-material';

const StudentWelcome = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('name') || 'Student Name';
  const userEmail = localStorage.getItem('user_id') ? `${localStorage.getItem('user_id')}@ubu.ac.th` : 'student@ubu.ac.th';
  const studentId = localStorage.getItem('user_id') || '67114540088';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
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
      <Card sx={{ maxWidth: 550, width: '100%', borderRadius: 3, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', p: 2 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Stack spacing={3} alignItems="center">
            <Avatar sx={{ bgcolor: 'secondary.main', width: 72, height: 72 }}>
              <StudentIcon sx={{ fontSize: 40 }} />
            </Avatar>
            
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                ยินดีต้อนรับนักศึกษา
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {userName} ({studentId})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userEmail}
              </Typography>
            </Box>

            <Divider sx={{ width: '100%' }} />

            <Box sx={{ bgcolor: '#f4f6f8', p: 3, borderRadius: 2, textAlign: 'left', border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#b06000' }}>
                💡 ชี้แจงสำหรับนักศึกษาและอาจารย์ผู้ประเมิน:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                ระบบยืม-คืนอุปกรณ์ IT DSSI ในส่วนที่คุณชยัยศ รับผิดชอบคือ <b>Module 1 (Authentication), Module 4 (Admin Dashboard) และ Module 5 (Overdue Notifications)</b> ซึ่งเป็นฟังก์ชันฝั่งผู้ดูแลระบบ (Admin) ทั้งหมดครับ
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                สำหรับฟังก์ชันฝั่งนักศึกษา (หน้าจอการสแกน QR Code เพื่อยืม/รายงานของเสีย) จะเป็นของ <b>Module 2 และ Module 3</b> ซึ่งรับผิดชอบโดยเพื่อนร่วมกลุ่มท่านอื่น
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              ต้องการทดสอบระบบ Admin Dashboard (Module 4, 5)?
            </Typography>

            <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ py: 1.2, borderRadius: 2 }}
              >
                ออกจากระบบ
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => {
                  localStorage.clear();
                  // Force redirect to login so they can click Admin Mock
                  navigate('/login');
                }}
                sx={{ py: 1.2, borderRadius: 2, fontWeight: 600 }}
              >
                เข้าใหม่ด้วยบัญชี Admin
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StudentWelcome;
