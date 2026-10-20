import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography
} from '@mui/material';
import {
  NotificationsActive as NotificationsIcon,
  MarkEmailRead as SentIcon,
  WarningAmber as EmptyIcon,
  Send as SendIcon,
  History as LogHistoryIcon,
  DeleteOutlineOutlined as DeleteIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const OverdueNotifications = () => {
  const [tab, setTab] = useState(0);

  const [overdueList, setOverdueList] = useState([]);
  const [overdueLoading, setOverdueLoading] = useState(true);
  const [overdueError, setOverdueError] = useState('');
  const [sendingId, setSendingId] = useState(null);
  const [success, setSuccess] = useState('');

  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    // Backend ส่งเวลาแบบ UTC แต่ไม่ติด timezone suffix (naive datetime)
    // ถ้าไม่เติม Z ให้ JS เอง จะถูกตีความเป็นเวลาท้องถิ่นผิดๆ (เพี้ยนไปตาม UTC offset)
    const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(dateStr);
    const isoStr = hasTimezone ? dateStr : `${dateStr}Z`;
    return new Date(isoStr).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchOverdue = async () => {
    setOverdueLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/notifications/overdue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverdueList(response.data);
      setOverdueError('');
    } catch (err) {
      console.error(err);
      setOverdueError('ไม่สามารถดึงข้อมูลรายการเกินกำหนดได้');
    } finally {
      setOverdueLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/notifications/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
      setLogsError('');
    } catch (err) {
      console.error(err);
      setLogsError('ไม่สามารถดึงข้อมูลประวัติการแจ้งเตือนได้');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
    fetchLogs();
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

      setSuccess(
        response.data.simulated
          ? `จำลองการส่งอีเมลแจ้งเตือนถึง ${tx.student_name} แล้ว (ยังไม่ได้ตั้งค่า SMTP จริง ดู log ใน console)`
          : `ส่งอีเมลแจ้งเตือนถึง ${tx.student_name} สำเร็จแล้ว`
      );
      fetchLogs();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error(err);
      setOverdueError(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการส่งแจ้งเตือน');
    } finally {
      setSendingId(null);
    }
  };

  const handleConfirmDeleteLog = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/notifications/logs/${deleteTarget.log_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`ลบประวัติการแจ้งเตือน #${deleteTarget.log_id} เรียบร้อยแล้ว`);
      setDeleteTarget(null);
      fetchLogs();

      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setLogsError(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการลบประวัติการแจ้งเตือน');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        icon={<NotificationsIcon color="primary" />}
        title="แจ้งเตือนเกินกำหนดคืน"
        subtitle="ติดตามรายการที่เกินกำหนดคืน ส่งอีเมลแจ้งเตือน และดูประวัติการแจ้งเตือนที่ส่งไปแล้ว"
      />

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(e, newValue) => setTab(newValue)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
        >
          <Tab
            icon={<NotificationsIcon fontSize="small" />}
            iconPosition="start"
            label={`รายการเกินกำหนด (${overdueList.length})`}
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 56 }}
          />
          <Tab
            icon={<LogHistoryIcon fontSize="small" />}
            iconPosition="start"
            label="ประวัติการแจ้งเตือน"
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 56 }}
          />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ p: 0 }}>
            {overdueError && (
              <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
                {overdueError}
              </Alert>
            )}
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>รหัสนักศึกษา</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ชื่อ-นามสกุล</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>รหัสอุปกรณ์</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ชื่ออุปกรณ์</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>กำหนดคืน</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>เกินกำหนดมาแล้ว</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overdueLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : overdueList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyState
                          icon={<EmptyIcon sx={{ fontSize: 40 }} />}
                          title="ไม่มีรายการเกินกำหนดคืน"
                          description="ตอนนี้ไม่มีนักศึกษาคนไหนค้างคืนอุปกรณ์เกินกำหนดเลย"
                          tone="success"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    overdueList.map((tx) => (
                      <TableRow key={tx.transaction_id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{tx.user_id}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{tx.student_name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{tx.assets_id}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{tx.assets_name}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{formatDate(tx.return_deadline)}</TableCell>
                        <TableCell>
                          <Chip label={`${tx.days_overdue} วัน`} color="error" size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="ส่งอีเมลแจ้งเตือน">
                            <span>
                              <Button
                                variant="contained"
                                color="warning"
                                size="small"
                                startIcon={sendingId === tx.transaction_id ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                                onClick={() => handleSendWarning(tx)}
                                disabled={sendingId === tx.transaction_id}
                                sx={{ textTransform: 'none', borderRadius: 1.5 }}
                              >
                                ส่งอีเมลทวง
                              </Button>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ p: 0 }}>
            {logsError && (
              <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
                {logsError}
              </Alert>
            )}
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>วันที่ส่ง</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>รหัสนักศึกษา</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ชื่อ-นามสกุล</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>รหัสอุปกรณ์</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ชื่ออุปกรณ์</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">จัดการ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={30} />
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState
                          icon={<SentIcon sx={{ fontSize: 40 }} />}
                          title="ยังไม่เคยส่งการแจ้งเตือนเลย"
                          description="ประวัติการแจ้งเตือนที่ส่งไปแล้วจะแสดงที่นี่"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.log_id} hover>
                        <TableCell sx={{ fontSize: 13 }}>{formatDate(log.sent_at)}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{log.student_id}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{log.student_name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{log.assets_id}</TableCell>
                        <TableCell sx={{ fontSize: 13 }}>{log.assets_name}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="ลบประวัตินี้ (กรณีส่งผิดคนหรือกดซ้ำโดยไม่ตั้งใจ)">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteTarget(log)}
                              sx={{ border: '1px solid', borderColor: 'error.light' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>

      {/* Delete Log Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
          ยืนยันการลบประวัติการแจ้งเตือน
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            ต้องการลบประวัติการส่งอีเมลแจ้งเตือนถึง <b>{deleteTarget?.student_name}</b> ({deleteTarget?.student_id})
            สำหรับอุปกรณ์ <b>{deleteTarget?.assets_name}</b> ใช่หรือไม่ — การลบนี้ไม่สามารถกู้คืนได้
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" disabled={deleting}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirmDeleteLog}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            ลบประวัตินี้
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OverdueNotifications;
