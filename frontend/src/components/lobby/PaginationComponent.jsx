import React from 'react'
import {Box, Button} from '@components/ui'
import {ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon} from 'lucide-react'

const PaginationComponent = ({ currentPage, totalPages, onPageChange, disabled = false }) => (
  <Box style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: '16px', 
    paddingTop: '16px', 
    borderTop: '1px solid #e0e0e0' 
  }}>
    <Button
      startIcon={<ChevronLeftIcon size={16} />}
      onClick={() => onPageChange(currentPage - 1)}
      disabled={disabled || currentPage === 0}
      variant="outlined"
      size="small"
      style={{ minWidth: '100px' }}
    >
      이전
    </Button>
    
    <Box style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      backgroundColor: '#1976d2',
      color: 'white',
      padding: '4px 16px',
      borderRadius: '8px',
      fontSize: '0.875rem'
    }}>
      {currentPage + 1} / {totalPages}
    </Box>
    
    <Button
      endIcon={<ChevronRightIcon size={16} />}
      onClick={() => onPageChange(currentPage + 1)}
      disabled={disabled || currentPage === totalPages - 1}
      variant="outlined"
      size="small"
      style={{ minWidth: '100px' }}
    >
      다음
    </Button>
  </Box>
)

export default PaginationComponent