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
  TextField,
  Button,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider
} from '@mui/material';
import { Search as SearchIcon, KeyboardReturn as ReturnIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';

const CurrentTransactions = () => {
  const [txs, setTxs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [condition, setCondition] = useState('ปกติ');
  const [submitting, setSubmitting] = useState(false);

  const fetchCurrentTransactions = async (studentId = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/transactions/current`;
      if (studentId) {
        url += `?search=${studentId}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTxs(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถดึงข้อมูลรายการยืมปัจจุบันได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentTransactions();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchCurrentTransactions(val);
  };

  const handleOpenReturnDialog = (tx) => {
    setSelectedTx(tx);
    setCondition('ปกติ');
    setOpenDialog(true);
  };

  const handleCloseReturnDialog = () => {
    setOpenDialog(false);
    setSelectedTx(null);
  };

  const handleConfirmReturn = async () => {
    if (!selectedTx) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/transactions/${selectedTx.transaction_id}/return`,
        { condition_status: condition },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(`ทำรายการคืนอุปกรณ์ ${selectedTx.assets_id} สำเร็จ เรียบร้อยแล้ว`);
      handleCloseReturnDialog();
      fetchCurrentTransactions(search);
      
      // Auto close success alert after 4 seconds
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการบันทึกการคืนอุปกรณ์');
    } finally {
      setSubmitting(false);
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

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          🔎 ค้นหาและทำรายการคืนอุปกรณ์
        </Typography>

        <Box display="flex" gap={2} sx={{ mb: 1 }}>
          <TextField
            fullWidth
            label="ค้นหาตามรหัสนักศึกษา"
            variant="outlined"
            size="small"
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
            }}
            placeholder="เช่น 67114540088..."
          />
        </Box>
      </Paper>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f4f6f8' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>รหัสรายการ</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>รหัสนักศึกษา</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ชื่อ-นามสกุล</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>รหัสอุปกรณ์</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ชื่ออุปกรณ์</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ห้องที่อยู่</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>เวลาที่ยืม</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>กำหนดส่งคืน</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>สถานะ</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : txs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  ไม่มีรายการยืมอุปกรณ์ในขณะนี้
                </TableCell>
              </TableRow>
            ) : (
              txs.map((tx) => (
                <TableRow key={tx.transaction_id} hover>
                  <TableCell>#{tx.transaction_id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{tx.user_id}</TableCell>
                  <TableCell>{tx.student_name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{tx.assets_id}</TableCell>
                  <TableCell>{tx.assets_name}</TableCell>
                  <TableCell>{tx.room_name}</TableCell>
                  <TableCell>{formatDate(tx.borrowed_at)}</TableCell>
                  <TableCell>{formatDate(tx.return_deadline)}</TableCell>
                  <TableCell>
                    {tx.is_overdue ? (
                      <Chip label="เกินกำหนดส่ง" color="error" size="small" sx={{ fontWeight: 600 }} />
                    ) : (
                      <Chip label="ปกติ" color="success" size="small" sx={{ fontWeight: 600 }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<ReturnIcon />}
                      onClick={() => handleOpenReturnDialog(tx)}
                      sx={{ textTransform: 'none', borderRadius: 1.5, px: 2 }}
                    >
                      คืนของ
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Return Dialog */}
      <Dialog open={openDialog} onClose={handleCloseReturnDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider' }}>
          🔄 บันทึกการคืนอุปกรณ์ {selectedTx?.assets_id}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ทำรายการคืนของนักศึกษา: <b>{selectedTx?.student_name}</b> ({selectedTx?.user_id})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              อุปกรณ์: <b>{selectedTx?.assets_name}</b> (รหัส: {selectedTx?.assets_id})
            </Typography>

            <Divider sx={{ my: 1 }} />

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                สภาพอุปกรณ์ ณ ตอนนำมาคืน
              </FormLabel>
              <RadioGroup
                aria-label="condition-status"
                name="condition-status"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <FormControlLabel value="ปกติ" control={<Radio />} label="ปกติ (อุปกรณ์พร้อมให้ยืมต่อ)" />
                <FormControlLabel value="ชำรุด" control={<Radio />} label="ชำรุด (ย้ายเข้าระบบส่งซ่อม)" />
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseReturnDialog} color="inherit" disabled={submitting}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirmReturn}
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <ReturnIcon />}
          >
            ยืนยันการคืนอุปกรณ์
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CurrentTransactions;
