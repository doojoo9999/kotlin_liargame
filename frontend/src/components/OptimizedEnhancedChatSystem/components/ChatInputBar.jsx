import React, {useRef} from 'react'
import {Box, Button, Divider, Input as TextField, Typography} from '@components/ui'
import {Send as SendIcon, Smile as EmojiIcon} from 'lucide-react'
import {getChatThemeVariant} from '../../../styles/themeVariants'

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

    // Theme-aware styling
    const inputStyle = React.useMemo(() => ({
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        transition: 'all 0.3s ease',
        borderRadius: '8px',
        padding: '12px',
        minHeight: '40px',
        resize: 'vertical',
        flex: 1
    }), [isDarkMode])

    return (
        <>
            <Divider />
            <Box style={{
                padding: isMobile ? '8px' : '16px',
                backgroundColor: chatTheme.message.background || '#ffffff',
                transition: 'color 0.3s ease'
            }}>
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '8px'
                }}>
                    <TextField
                        ref={inputRef}
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder={disabled ? "채팅이 비활성화되었습니다..." : placeholder}
                        disabled={disabled}
                        autoFocus={!disabled}
                        style={inputStyle}
                    />
                    
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        marginLeft: '8px'
                    }}>
                        {/* Emoji button */}
                        <Button
                            onClick={onEmojiButtonClick}
                            disabled={disabled}
                            aria-label="Add emoji"
                            style={{
                                minWidth: '32px',
                                width: '32px',
                                height: '32px',
                                padding: '4px',
                                borderRadius: '50%',
                                transition: 'all 0.3s ease',
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                '&:hover': {
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                    transform: 'scale(1.1)'
                                },
                                '&:disabled': {
                                    opacity: 0.5
                                }
                            }}
                        >
                            <EmojiIcon size={16} />
                        </Button>

                        {/* Send button */}
                        <Button
                            onClick={handleSendClick}
                            disabled={disabled || !inputValue.trim()}
                            aria-label="Send message"
                            style={{
                                minWidth: '32px',
                                width: '32px',
                                height: '32px',
                                padding: '4px',
                                borderRadius: '50%',
                                transition: 'all 0.3s ease',
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                '&:hover': {
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                    transform: 'scale(1.1)'
                                },
                                '&:disabled': {
                                    opacity: 0.5
                                }
                            }}
                        >
                            <SendIcon size={16} />
                        </Button>
                    </div>
                </div>
                
                <Box style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px',
                    padding: '0 8px'
                }}>
                    <Typography variant="caption" style={{ opacity: 0.7 }}>
                        {`${inputValue.length}/${maxLength}`}
                    </Typography>
                    {debugText && (
                        <Typography variant="caption" style={{ opacity: 0.5 }}>
                            {debugText}
                        </Typography>
                    )}
                </Box>
            </Box>
        </>
    )
})

ChatInputBar.displayName = 'ChatInputBar'

export default ChatInputBar