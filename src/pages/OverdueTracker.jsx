import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  Stack
} from '@mui/material';
import { Mail as EmailIcon, AccessTime as ClockIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';

const OverdueTracker = () => {
  const [overdues, setOverdues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Real-time Clock (Module 5 Specification Requirement)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Action status
  const [sendingId, setSendingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOverdues = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/notifications/overdue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverdues(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถดึงข้อมูลรายการค้างส่งได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdues();
  }, []);

  const handleSendWarning = async (tx) => {
    setSendingId(tx.transaction_id);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/notifications/warn`,
        { transaction_id: tx.transaction_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const isSimulated = response.data.simulated;
      if (isSimulated) {
        setToastMessage(`[จำลองส่งเมล] ยิงอีเมลเตือนนักศึกษาสำเร็จแล้ว (ส่งไปที่: ${tx.student_email})`);
      } else {
        setToastMessage(`ส่งเมลแจ้งเตือนสำเร็จแล้วไปยังอีเมล ${tx.student_email}`);
      }
      setToastOpen(true);
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการยิงอีเมลแจ้งเตือน');
    } finally {
      setSendingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSystemClock = (date) => {
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <Box>
      {/* Real-time Clock Banner - Spec: "มีวันที เวลา ปัจจุบันแสดงให้ดูด้วย" */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          boxShadow: '0 4px 15px rgba(30, 60, 114, 0.15)'
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <ClockIcon sx={{ fontSize: 28, color: '#ffeb3b' }} />
          <Box>
            <Typography variant="subtitle2" sx={{ opacity: 0.8, fontSize: 12 }}>
              วันเวลาปัจจุบันของระบบ (ตรวจสอบเกณฑ์เวลาค้างส่ง)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.5px' }}>
              {formatSystemClock(currentTime)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f4f6f8' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>รหัสนักศึกษา</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ชื่อ-นามสกุล</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>อีเมลติดต่อ</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>รหัสอุปกรณ์</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ชื่ออุปกรณ์</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>วันที่ยืม</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>กำหนดส่งคืน</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>เลยกำหนดแล้ว</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">ยิงทวงของ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : overdues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'success.main', fontWeight: 600 }}>
                  🎉 ยอดเยี่ยม! ไม่มีนักศึกษาค้างส่งอุปกรณ์เกินกำหนดเวลาในขณะนี้
                </TableCell>
              </TableRow>
            ) : (
              overdues.map((tx) => (
                <TableRow key={tx.transaction_id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{tx.user_id}</TableCell>
                  <TableCell>{tx.student_name}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{tx.student_email}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{tx.assets_id}</TableCell>
                  <TableCell>{tx.assets_name}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{formatDate(tx.borrowed_at)}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: 'error.main', fontWeight: 500 }}>
                    {formatDate(tx.return_deadline)}
                  </TableCell>
                  <TableCell sx={{ color: 'error.main', fontWeight: 700 }}>
                    {tx.days_overdue} วัน
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={sendingId === tx.transaction_id ? <CircularProgress size={16} color="inherit" /> : <EmailIcon />}
                      onClick={() => handleSendWarning(tx)}
                      disabled={sendingId !== null}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 1.5,
                        px: 2,
                        boxShadow: '0 2px 6px rgba(211, 47, 47, 0.2)'
                      }}
                    >
                      ยิงเมลเตือน
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Warning Alert Toast */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={5000}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            bgcolor: 'success.dark',
            borderRadius: 2,
            fontWeight: 600
          }
        }}
      />
    </Box>
  );
};

export default OverdueTracker;
