import React, {useRef} from 'react'
import {Box, Button, Divider, Input as TextField, Typography} from '@components/ui'
import {Send as SendIcon, Smile as EmojiIcon} from 'lucide-react'
import styled from 'styled-components'
import {getChatThemeVariant} from '../../../styles/themeVariants'

// Styled components to replace MUI sx styling
const InputContainer = styled(Box)`
  padding: ${props => props.$isMobile ? '8px' : '16px'};
  background-color: ${props => props.$backgroundColor || '#ffffff'};
  transition: color 0.3s ease;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 8px;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 4px;
  margin-left: 8px;
`

const IconButtonStyled = styled(Button)`
  min-width: 32px;
  width: 32px;
  height: 32px;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.$isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.5;
  }
`

const HelperTextContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding: 0 8px;
`

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
            <InputContainer $isMobile={isMobile} $backgroundColor={chatTheme.message.background}>
                <InputWrapper>
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
                    
                    <ButtonGroup>
                        {/* Emoji button */}
                        <IconButtonStyled
                            onClick={onEmojiButtonClick}
                            disabled={disabled}
                            $isDarkMode={isDarkMode}
                            aria-label="Add emoji"
                        >
                            <EmojiIcon size={16} />
                        </IconButtonStyled>

                        {/* Send button */}
                        <IconButtonStyled
                            onClick={handleSendClick}
                            disabled={disabled || !inputValue.trim()}
                            $isDarkMode={isDarkMode}
                            aria-label="Send message"
                        >
                            <SendIcon size={16} />
                        </IconButtonStyled>
                    </ButtonGroup>
                </InputWrapper>
                
                <HelperTextContainer>
                    <Typography variant="caption" style={{ opacity: 0.7 }}>
                        {`${inputValue.length}/${maxLength}`}
                    </Typography>
                    {debugText && (
                        <Typography variant="caption" style={{ opacity: 0.5 }}>
                            {debugText}
                        </Typography>
                    )}
                </HelperTextContainer>
            </InputContainer>
        </>
    )
})

ChatInputBar.displayName = 'ChatInputBar'

export default ChatInputBar