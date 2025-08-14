import React, { useRef } from 'react'
import {
    Box,
    Divider,
    IconButton,
    InputAdornment,
    TextField,
    Typography
} from '@mui/material'
import { EmojiEmotions as EmojiIcon, Send as SendIcon } from '@mui/icons-material'
import { getChatThemeVariant, THEME_TRANSITIONS } from '../../../styles/themeVariants'

/**
 * ChatInputBar component for text input, emoji, and send functionality
 */
const ChatInputBar = React.memo(({
    inputValue,
    onInputChange,
    onSendMessage,
    onEmojiButtonClick,
    disabled = false,
    placeholder = "메시지를 입력하세요...",
    maxLength = 200,
    isDarkMode,
    isMobile,
    debugText
}) => {
    const inputRef = useRef(null)
    const chatTheme = getChatThemeVariant(isDarkMode)

    const handleKeyPress = React.useCallback((event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            onSendMessage()
        }
    }, [onSendMessage])

    const handleSendClick = React.useCallback(() => {
        onSendMessage()
        inputRef.current?.focus()
    }, [onSendMessage])

    const handleInputChange = React.useCallback((e) => {
        onInputChange(e.target.value.slice(0, maxLength))
    }, [onInputChange, maxLength])

    // Stable sx objects to prevent re-renders
    const textFieldSx = React.useMemo(() => ({
        '& .MuiOutlinedInput-root': {
            backgroundColor: 'background.paper',
            transition: THEME_TRANSITIONS.standard,
            '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
            },
            '&.Mui-disabled': {
                backgroundColor: 'action.disabledBackground',
                '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'action.disabled'
                }
            }
        }
    }), [isDarkMode])

    const emojiButtonSx = React.useMemo(() => ({
        transition: THEME_TRANSITIONS.standard,
        '&:hover': {
            backgroundColor: 'action.hover',
            transform: 'scale(1.1)'
        }
    }), [])

    const sendButtonSx = React.useMemo(() => ({
        transition: THEME_TRANSITIONS.standard,
        '&:hover': {
            backgroundColor: 'primary.light',
            transform: 'scale(1.1)'
        },
        '&:disabled': {
            opacity: 0.5
        }
    }), [])

    const inputBarSx = React.useMemo(() => ({
        p: isMobile ? 1 : 2,
        backgroundColor: chatTheme.message.background,
        transition: THEME_TRANSITIONS.color
    }), [isMobile, chatTheme.message.background])

    return (
        <>
            <Divider />
            <Box sx={inputBarSx}>
                <TextField
                    ref={inputRef}
                    fullWidth
                    multiline
                    maxRows={3}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder={disabled ? "채팅이 비활성화되었습니다..." : placeholder}
                    disabled={disabled}
                    size={isMobile ? 'small' : 'medium'}
                    autoFocus={!disabled}
                    sx={textFieldSx}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {/* Emoji button */}
                                    <IconButton
                                        size="small"
                                        onClick={onEmojiButtonClick}
                                        disabled={disabled}
                                        sx={emojiButtonSx}
                                    >
                                        <EmojiIcon />
                                    </IconButton>

                                    {/* Send button */}
                                    <IconButton
                                        size="small"
                                        onClick={handleSendClick}
                                        disabled={disabled || !inputValue.trim()}
                                        color="primary"
                                        sx={sendButtonSx}
                                    >
                                        <SendIcon />
                                    </IconButton>
                                </Box>
                            </InputAdornment>
                        )
                    }}
                    helperText={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                {`${inputValue.length}/${maxLength}`}
                            </Typography>
                            {debugText && (
                                <Typography variant="caption" sx={{ opacity: 0.5 }}>
                                    {debugText}
                                </Typography>
                            )}
                        </Box>
                    }
                />
            </Box>
        </>
    )
})

ChatInputBar.displayName = 'ChatInputBar'

export default ChatInputBar