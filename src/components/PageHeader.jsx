// หัวข้อหน้า reusable (ไอคอน + ชื่อหน้า + คำอธิบาย + ปุ่ม/filter ด้านขวา) ใช้ซ้ำทุกหน้า admin

import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

/**
 * Shared header block used at the top of every admin page: an icon + title,
 * an optional subtitle, and an optional right-aligned action (filter, button, etc).
 */
const PageHeader = ({ icon, title, subtitle, action, children }) => (
  <Paper
    sx={{
      p: { xs: 2.5, sm: 3 },
      mb: 3,
      borderRadius: 3,
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2
      }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Box>
    {children && <Box sx={{ mt: 2.5 }}>{children}</Box>}
  </Paper>
);

export default PageHeader;
