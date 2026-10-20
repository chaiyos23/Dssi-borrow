import React, { useState, useEffect, useRef } from 'react';
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
  Divider,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  KeyboardReturn as ReturnIcon,
  PersonAdd as BorrowIcon,
  SwapHoriz as PageIcon,
  InboxOutlined as EmptyIcon,
  EditCalendar as EditDeadlineIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

const CurrentTransactions = () => {
  const [txs, setTxs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Return dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [condition, setCondition] = useState('ปกติ');
  const [issueDescription, setIssueDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Manual Borrow (Admin) dialog state
  const [openBorrowDialog, setOpenBorrowDialog] = useState(false);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [borrowUserId, setBorrowUserId] = useState('');
  const [borrowAssetId, setBorrowAssetId] = useState('');
  const [borrowDeadline, setBorrowDeadline] = useState('');
  const [borrowSubmitting, setBorrowSubmitting] = useState(false);
  const [borrowError, setBorrowError] = useState('');
  const [studentOptions, setStudentOptions] = useState([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const studentSearchTimer = useRef(null);

  // Edit Deadline dialog state
  const [openEditDeadlineDialog, setOpenEditDeadlineDialog] = useState(false);
  const [editDeadlineTx, setEditDeadlineTx] = useState(null);
  const [newDeadlineValue, setNewDeadlineValue] = useState('');
  const [editDeadlineSubmitting, setEditDeadlineSubmitting] = useState(false);
  const [editDeadlineError, setEditDeadlineError] = useState('');

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
    setIssueDescription('');
    setOpenDialog(true);
  };

  const handleCloseReturnDialog = () => {
    setOpenDialog(false);
    setSelectedTx(null);
    setIssueDescription('');
  };

  const handleConfirmReturn = async () => {
    if (!selectedTx) return;
    if (condition === 'ชำรุด' && !issueDescription.trim()) {
      setError('กรุณาระบุสาเหตุความเสียหาย');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/transactions/${selectedTx.transaction_id}/return`,
        {
          condition_status: condition,
          issue_description: condition === 'ชำรุด' ? issueDescription.trim() : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`ทำรายการคืนอุปกรณ์ ${selectedTx.assets_id} สำเร็จ เรียบร้อยแล้ว`);
      handleCloseReturnDialog();
      fetchCurrentTransactions(search);

      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการบันทึกการคืนอุปกรณ์');
    } finally {
      setSubmitting(false);
    }
  };

  const getDefaultDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d - tzOffset).toISOString().slice(0, 16);
  };

  const toDatetimeLocalValue = (isoString) => {
    const d = new Date(isoString);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d - tzOffset).toISOString().slice(0, 16);
  };

  const handleOpenEditDeadline = (tx) => {
    setEditDeadlineTx(tx);
    setNewDeadlineValue(toDatetimeLocalValue(tx.return_deadline));
    setEditDeadlineError('');
    setOpenEditDeadlineDialog(true);
  };

  const handleCloseEditDeadline = () => {
    setOpenEditDeadlineDialog(false);
    setEditDeadlineTx(null);
  };

  const handleConfirmEditDeadline = async () => {
    if (!editDeadlineTx || !newDeadlineValue) return;
    setEditDeadlineSubmitting(true);
    setEditDeadlineError('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_BASE_URL}/transactions/${editDeadlineTx.transaction_id}/deadline`,
        { return_deadline: new Date(newDeadlineValue).toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`แก้ไขกำหนดส่งคืนของรายการ #${editDeadlineTx.transaction_id} สำเร็จ`);
      handleCloseEditDeadline();
      fetchCurrentTransactions(search);

      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setEditDeadlineError(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการแก้ไขกำหนดส่งคืน');
    } finally {
      setEditDeadlineSubmitting(false);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/transactions/available-assets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableAssets(response.data);
    } catch (err) {
      console.error('Failed to fetch available assets', err);
    }
  };

  const searchStudents = async (query) => {
    if (!query || !query.trim()) {
      setStudentOptions([]);
      return;
    }
    setStudentSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/transactions/search-students`, {
        params: { q: query.trim() },
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentOptions(response.data);
    } catch (err) {
      console.error('Failed to search students', err);
    } finally {
      setStudentSearchLoading(false);
    }
  };

  const handleStudentInputChange = (query) => {
    setStudentSearchQuery(query);
    if (studentSearchTimer.current) clearTimeout(studentSearchTimer.current);
    studentSearchTimer.current = setTimeout(() => searchStudents(query), 300);
  };

  const handleOpenBorrowDialog = () => {
    setBorrowUserId('');
    setBorrowAssetId('');
    setBorrowDeadline(getDefaultDeadline());
    setBorrowError('');
    setStudentOptions([]);
    setSelectedStudent(null);
    setStudentSearchQuery('');
    fetchAvailableAssets();
    setOpenBorrowDialog(true);
  };

  const handleCloseBorrowDialog = () => {
    setOpenBorrowDialog(false);
  };

  const handleConfirmBorrow = async () => {
    if (!borrowUserId || !borrowAssetId || !borrowDeadline) {
      setBorrowError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    setBorrowSubmitting(true);
    setBorrowError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/transactions/borrow`,
        {
          user_id: borrowUserId.trim(),
          assets_id: borrowAssetId,
          return_deadline: new Date(borrowDeadline).toISOString()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`บันทึกรายการยืม ${borrowAssetId} ให้รหัสนักศึกษา ${borrowUserId} สำเร็จ`);
      handleCloseBorrowDialog();
      fetchCurrentTransactions(search);

      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setBorrowError(err.response?.data?.detail || 'เกิดข้อผิดพลาดในการบันทึกรายการยืม');
    } finally {
      setBorrowSubmitting(false);
    }
  };

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

  return (
    <Box>
      <PageHeader
        icon={<PageIcon color="primary" />}
        title="รายการยืมปัจจุบัน"
        subtitle={`อุปกรณ์ที่กำลังถูกยืมอยู่ ${txs.length ? `(${txs.length} รายการ)` : ''}`}
        action={
          <Button
            variant="contained"
            color="secondary"
            startIcon={<BorrowIcon />}
            onClick={handleOpenBorrowDialog}
            sx={{ textTransform: 'none', borderRadius: 2, px: 2.5, whiteSpace: 'nowrap' }}
          >
            ยืมของ (Admin)
          </Button>
        }
      >
        <TextField
          fullWidth
          label="ค้นหาตามรหัสนักศึกษา"
          variant="outlined"
          size="small"
          value={search}
          onChange={handleSearchChange}
          placeholder="เช่น 67114540088..."
          slotProps={{
            input: {
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
            }
          }}
        />
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
                <TableCell colSpan={10}>
                  <EmptyState
                    icon={<EmptyIcon sx={{ fontSize: 40 }} />}
                    title="ไม่มีรายการยืมอุปกรณ์ในขณะนี้"
                    description={search ? `ไม่พบรายการของรหัสนักศึกษา "${search}"` : 'เมื่อมีการยืมอุปกรณ์ รายการจะแสดงที่นี่'}
                  />
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
                  <TableCell sx={{ fontSize: 13 }}>{formatDate(tx.borrowed_at)}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{formatDate(tx.return_deadline)}</TableCell>
                  <TableCell>
                    {tx.is_overdue ? (
                      <Chip label="เกินกำหนดส่ง" color="error" size="small" sx={{ fontWeight: 600 }} />
                    ) : (
                      <Chip label="ปกติ" color="success" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="แก้ไขกำหนดส่งคืน">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEditDeadline(tx)}
                          sx={{ border: '1px solid', borderColor: 'primary.light' }}
                        >
                          <EditDeadlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Return Dialog */}
      <Dialog open={openDialog} onClose={handleCloseReturnDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
          บันทึกการคืนอุปกรณ์ {selectedTx?.assets_id}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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

            {condition === 'ชำรุด' && (
              <TextField
                fullWidth
                required
                multiline
                rows={3}
                label="สาเหตุความเสียหาย"
                placeholder="เช่น หน้าจอแตก เปิดไม่ติด สายชาร์จหาย ฯลฯ"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                error={!issueDescription.trim()}
                helperText={!issueDescription.trim() ? 'กรุณาระบุสาเหตุความเสียหาย' : ''}
              />
            )}
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
            disabled={submitting || (condition === 'ชำรุด' && !issueDescription.trim())}
            startIcon={submitting ? <CircularProgress size={20} /> : <ReturnIcon />}
          >
            ยืนยันการคืนอุปกรณ์
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Borrow (Admin) Dialog */}
      <Dialog open={openBorrowDialog} onClose={handleCloseBorrowDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
          บันทึกรายการยืมอุปกรณ์ (Admin)
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ใช้สำหรับกรณีนักศึกษามารับอุปกรณ์ที่หน้าเคาน์เตอร์แต่ลืมสแกน QR Code เพื่อยืม
            </Typography>

            {borrowError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {borrowError}
              </Alert>
            )}

            <Autocomplete
              fullWidth
              size="small"
              options={studentOptions}
              loading={studentSearchLoading}
              value={selectedStudent}
              filterOptions={(x) => x}
              noOptionsText={
                studentSearchLoading
                  ? 'กำลังค้นหา...'
                  : studentSearchQuery.trim()
                    ? `ไม่พบนักศึกษาที่มีรหัสตรงกับ "${studentSearchQuery.trim()}" ลองตรวจสอบรหัสอีกครั้ง`
                    : 'พิมพ์รหัสนักศึกษาเพื่อค้นหา เช่น 671145'
              }
              getOptionLabel={(option) =>
                option.user_id
                  ? `${option.user_id}${option.first_name ? ` - ${option.first_name} ${option.last_name || ''}` : ''}`
                  : ''
              }
              isOptionEqualToValue={(option, value) => option.user_id === value.user_id}
              onChange={(e, newValue) => {
                setSelectedStudent(newValue);
                setBorrowUserId(newValue ? newValue.user_id : '');
              }}
              onInputChange={(e, newInputValue, reason) => {
                if (reason === 'input') handleStudentInputChange(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="รหัสนักศึกษา"
                  variant="outlined"
                  placeholder="พิมพ์รหัสนักศึกษาเพื่อค้นหา เช่น 671145"
                  InputProps={{
                    ...(params.InputProps || {}),
                    endAdornment: (
                      <>
                        {studentSearchLoading ? <CircularProgress size={16} /> : null}
                        {params.InputProps?.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />

            <FormControl fullWidth size="small">
              <InputLabel id="borrow-asset-label">เลือกอุปกรณ์ที่ว่าง</InputLabel>
              <Select
                labelId="borrow-asset-label"
                label="เลือกอุปกรณ์ที่ว่าง"
                value={borrowAssetId}
                onChange={(e) => setBorrowAssetId(e.target.value)}
              >
                {availableAssets.length === 0 ? (
                  <MenuItem value="" disabled>ไม่มีอุปกรณ์ว่างในขณะนี้</MenuItem>
                ) : (
                  availableAssets.map((asset) => (
                    <MenuItem key={asset.assets_id} value={asset.assets_id}>
                      {asset.assets_id} - {asset.assets_name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="กำหนดส่งคืน"
              type="datetime-local"
              variant="outlined"
              size="small"
              value={borrowDeadline}
              onChange={(e) => setBorrowDeadline(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseBorrowDialog} color="inherit" disabled={borrowSubmitting}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirmBorrow}
            variant="contained"
            color="secondary"
            disabled={borrowSubmitting}
            startIcon={borrowSubmitting ? <CircularProgress size={20} /> : <BorrowIcon />}
          >
            ยืนยันการยืม
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Deadline Dialog */}
      <Dialog open={openEditDeadlineDialog} onClose={handleCloseEditDeadline} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
          แก้ไขกำหนดส่งคืน {editDeadlineTx?.assets_id}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              สำหรับกรณีนักศึกษา <b>{editDeadlineTx?.student_name}</b> ({editDeadlineTx?.user_id}) ขอเลื่อนกำหนดคืน อุปกรณ์ <b>{editDeadlineTx?.assets_name}</b>
            </Typography>

            {editDeadlineError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {editDeadlineError}
              </Alert>
            )}

            <TextField
              fullWidth
              label="กำหนดส่งคืนใหม่"
              type="datetime-local"
              variant="outlined"
              size="small"
              value={newDeadlineValue}
              onChange={(e) => setNewDeadlineValue(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={handleCloseEditDeadline} color="inherit" disabled={editDeadlineSubmitting}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirmEditDeadline}
            variant="contained"
            color="primary"
            disabled={editDeadlineSubmitting}
            startIcon={editDeadlineSubmitting ? <CircularProgress size={20} /> : <EditDeadlineIcon />}
          >
            บันทึกกำหนดส่งคืนใหม่
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CurrentTransactions;
