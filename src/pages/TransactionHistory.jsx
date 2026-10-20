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
  FormControl,
  FormLabel,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import { Search as SearchIcon, History as HistoryIcon, ManageSearchOutlined as EmptyIcon, EditNote as EditConditionIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const TransactionHistory = () => {
  const [history, setHistory] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit Condition dialog state
  const [openEditConditionDialog, setOpenEditConditionDialog] = useState(false);
  const [editConditionTx, setEditConditionTx] = useState(null);
  const [newConditionValue, setNewConditionValue] = useState('ปกติ');
  const [editIssueDescription, setEditIssueDescription] = useState('');
  const [editConditionSubmitting, setEditConditionSubmitting] = useState(false);
  const [editConditionError, setEditConditionError] = useState('');

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/analytics/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let params = [];
      if (search) params.push(`search=${search}`);
      if (selectedRoom) params.push(`room_id=${selectedRoom}`);
      if (statusFilter !== 'All') params.push(`status_filter=${statusFilter}`);
      if (overdueOnly) params.push(`overdue_only=true`);

      const queryStr = params.length > 0 ? `?${params.join('&')}` : '';

      const response = await axios.get(`${API_BASE_URL}/transactions/history${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถดึงข้อมูลประวัติการทำรายการได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [search, selectedRoom, statusFilter, overdueOnly]);

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

  const hasActiveFilters = search || selectedRoom || statusFilter !== 'All' || overdueOnly;

  const handleOpenEditCondition = (tx) => {
    setEditConditionTx(tx);
    setNewConditionValue(tx.condition_status === 'ชำรุด' ? 'ชำรุด' : 'ปกติ');
    setEditIssueDescription('');
    setEditConditionError('');
    setOpenEditConditionDialog(true);
  };

  const handleCloseEditCondition = () => {
    setOpenEditConditionDialog(false);
    setEditConditionTx(null);
    setEditIssueDescription('');
  };

  const handleConfirmEditCondition = async () => {
    if (!editConditionTx) return;
    if (newConditionValue === 'ชำรุด' && !editIssueDescription.trim()) {
      setEditConditionError('กรุณาระบุสาเหตุความเสียหาย');
      return;
    }
    setEditConditionSubmitting(true);
    setEditConditionError('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/transactions/${editConditionTx.transaction_id}/condition`,
        {
          condition_status: newConditionValue,
          issue_description: newConditionValue === 'ชำรุด' ? editIssueDescription.trim() : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`แก้ไขสภาพการใช้งานของรายการ #${editConditionTx.transaction_id} สำเร็จ`);
      handleCloseEditCondition();
      fetchHistory();

      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setEditConditionError(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการแก้ไขสภาพการใช้งาน');
    } finally {
      setEditConditionSubmitting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        icon={<HistoryIcon color="primary" />}
        title="ประวัติการยืม-คืน"
        subtitle="ค้นหาและกรองประวัติการทำรายการทั้งหมดในระบบ"
      >
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              fullWidth
              label="ค้นหารหัสนักศึกษา"
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="รหัสนักศึกษา..."
              slotProps={{
                input: { startAdornment: <SearchIcon color="action" sx={{ mr: 0.5 }} /> }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>กรองตามห้องเก็บอุปกรณ์</InputLabel>
              <Select
                value={selectedRoom}
                label="กรองตามห้องเก็บอุปกรณ์"
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                <MenuItem value="">ห้องทั้งหมด</MenuItem>
                {rooms.map((room) => (
                  <MenuItem key={room.room_id} value={room.room_id}>
                    {room.room_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>ประเภทรายการ</InputLabel>
              <Select
                value={statusFilter}
                label="ประเภทรายการ"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="All">รายการทั้งหมด</MenuItem>
                <MenuItem value="Active">กำลังถูกยืม (ยังไม่คืน)</MenuItem>
                <MenuItem value="Returned">ส่งคืนแล้ว</MenuItem>
                <MenuItem value="Damaged">คืนแล้วพบการชำรุด</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                  color="primary"
                />
              }
              label="เฉพาะรายการส่งช้า/ค้างส่ง"
            />
          </Grid>
        </Grid>
      </PageHeader>

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

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>วันที่/เวลาทำรายการ</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ประเภท</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>รหัสนักศึกษา</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ชื่อ-นามสกุล</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>รหัสอุปกรณ์</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ชื่ออุปกรณ์</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ห้อง</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>สภาพตอนส่งคืน</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>กำหนดคืน</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>การส่งคืน</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11}>
                  <EmptyState
                    icon={<EmptyIcon sx={{ fontSize: 40 }} />}
                    title="ไม่พบประวัติตามเงื่อนไขที่เลือก"
                    description={hasActiveFilters ? 'ลองปรับตัวกรองด้านบนแล้วค้นหาอีกครั้ง' : 'ยังไม่มีประวัติการยืม-คืนในระบบ'}
                  />
                </TableCell>
              </TableRow>
            ) : (
              history.map((tx) => {
                const isReturned = tx.returned_at !== null;
                const isLate = tx.is_overdue;

                return (
                  <TableRow key={tx.transaction_id} hover>
                    <TableCell sx={{ fontSize: 13 }}>
                      {isReturned ? formatDate(tx.returned_at) : formatDate(tx.borrowed_at)}
                    </TableCell>
                    <TableCell>
                      {isReturned ? (
                        <Chip label="คืน" color="success" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : (
                        <Chip label="ยืม" color="primary" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{tx.user_id}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{tx.student_name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{tx.assets_id}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{tx.assets_name}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{tx.room_name}</TableCell>
                    <TableCell>
                      {tx.condition_status === 'ชำรุด' ? (
                        <Chip label="ชำรุด" color="error" size="small" sx={{ fontWeight: 600 }} />
                      ) : tx.condition_status === 'ปกติ' ? (
                        <Chip label="ปกติ" color="success" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{formatDate(tx.return_deadline)}</TableCell>
                    <TableCell>
                      {isReturned ? (
                        isLate ? (
                          <Chip label="คืนล่าช้า" color="warning" size="small" sx={{ fontWeight: 600 }} />
                        ) : (
                          <Chip label="ตรงเวลา" color="success" size="small" sx={{ fontWeight: 600 }} />
                        )
                      ) : isLate ? (
                        <Chip label="เกินกำหนด (ค้างส่ง)" color="error" size="small" sx={{ fontWeight: 600 }} />
                      ) : (
                        <Chip label="กำลังยืม (ปกติ)" color="info" size="small" sx={{ fontWeight: 600 }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {isReturned ? (
                        <Tooltip title="แก้ไขสภาพการใช้งาน">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEditCondition(tx)}
                            sx={{ border: '1px solid', borderColor: 'primary.light' }}
                          >
                            <EditConditionIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Condition Dialog */}
      <Dialog open={openEditConditionDialog} onClose={handleCloseEditCondition} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
          แก้ไขสภาพการใช้งาน {editConditionTx?.assets_id}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              รายการยืม-คืนของ <b>{editConditionTx?.student_name}</b> ({editConditionTx?.user_id}) อุปกรณ์ <b>{editConditionTx?.assets_name}</b>
            </Typography>

            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              การแก้ไขนี้จะเปลี่ยนสถานะอุปกรณ์ในคลังด้วย — ถ้าตั้งเป็น "ชำรุด" อุปกรณ์จะถูกงดให้ยืม ถ้าตั้งเป็น "ปกติ" อุปกรณ์จะกลับมาว่างให้ยืมได้ (เว้นแต่กำลังถูกยืมอยู่ในรายการอื่น)
            </Alert>

            {editConditionError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {editConditionError}
              </Alert>
            )}

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                สภาพการใช้งานที่ถูกต้อง
              </FormLabel>
              <RadioGroup
                aria-label="condition-status"
                name="edit-condition-status"
                value={newConditionValue}
                onChange={(e) => setNewConditionValue(e.target.value)}
              >
                <FormControlLabel value="ปกติ" control={<Radio />} label="ปกติ (อุปกรณ์พร้อมให้ยืมต่อ)" />
                <FormControlLabel value="ชำรุด" control={<Radio />} label="ชำรุด (ย้ายเข้าระบบส่งซ่อม)" />
              </RadioGroup>
            </FormControl>

            {newConditionValue === 'ชำรุด' && (
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="สาเหตุความเสียหาย"
                placeholder="เช่น หน้าจอแตก เปิดไม่ติด สายชาร์จหาย ฯลฯ"
                value={editIssueDescription}
                onChange={(e) => setEditIssueDescription(e.target.value)}
                error={!editIssueDescription.trim()}
                helperText={!editIssueDescription.trim() ? 'กรุณาระบุสาเหตุความเสียหาย' : ''}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseEditCondition} color="inherit" disabled={editConditionSubmitting}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirmEditCondition}
            variant="contained"
            color="primary"
            disabled={editConditionSubmitting || (newConditionValue === 'ชำรุด' && !editIssueDescription.trim())}
            startIcon={editConditionSubmitting ? <CircularProgress size={20} /> : <EditConditionIcon />}
          >
            บันทึกการแก้ไข
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionHistory;
