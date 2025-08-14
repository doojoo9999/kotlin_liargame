import React from 'react'
import {Box, Button} from '@mui/material'
import {ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon} from '@mui/icons-material'

const PaginationComponent = ({ currentPage, totalPages, onPageChange, disabled = false }) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    mt: 2, 
    pt: 2, 
    borderTop: '1px solid #e0e0e0' 
  }}>
    <Button
      startIcon={<ChevronLeftIcon />}
      onClick={() => onPageChange(currentPage - 1)}
      disabled={disabled || currentPage === 0}
      variant="outlined"
      size="small"
      sx={{ minWidth: 100 }}
    >
      이전
    </Button>
    
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      bgcolor: 'primary.main',
      color: 'white',
      px: 2,
      py: 0.5,
      borderRadius: 2,
      fontSize: '0.875rem'
    }}>
      {currentPage + 1} / {totalPages}
    </Box>
    
    <Button
      endIcon={<ChevronRightIcon />}
      onClick={() => onPageChange(currentPage + 1)}
      disabled={disabled || currentPage === totalPages - 1}
      variant="outlined"
      size="small"
      sx={{ minWidth: 100 }}
    >
      다음
    </Button>
  </Box>
)

export default PaginationComponent