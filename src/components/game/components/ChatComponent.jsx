import PropTypes from 'prop-types';

const ChatComponent = ({
  chatMessages,
  newMessage,
  setNewMessage,
  sendMessage,
  voiceChatEnabled,
  isConnecting,
  toggleVoiceChat,
  isMuted,
  toggleMute,
  connectionStatus,
  user,
  remoteAudioRef
}) => {
  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Game Chat</h3>
        <div className="voice-chat-controls">
          <button 
            onClick={toggleVoiceChat} 
            className={`voice-chat-toggle ${voiceChatEnabled ? 'active' : ''}`}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : voiceChatEnabled ? 'Disable Voice' : 'Enable Voice'}
          </button>
          {voiceChatEnabled && (
            <button 
              onClick={toggleMute} 
              className={`mute-button ${isMuted ? 'muted' : ''}`}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
          )}
          {voiceChatEnabled && (
            <span className={`connection-status ${connectionStatus}`}>
              {connectionStatus === 'disconnected' && 'Disconnected'}
              {connectionStatus === 'waiting' && 'Waiting for opponent...'}
              {connectionStatus === 'connecting' && 'Connecting...'}
              {connectionStatus === 'connected' && 'Connected'}
              {connectionStatus === 'error' && 'Connection Error'}
            </span>
          )}
        </div>
      </div>
      <div className="chat-messages">
        {chatMessages.length === 0 ? (
          <div className="empty-chat-message">No messages yet. Start the conversation!</div>
        ) : (
          chatMessages.map((message) => (
            <div 
              key={message.id} 
              className={`chat-message ${message.sender === user?.uid ? 'my-message' : 'other-message'}`}
            >
              <div className="message-sender">{message.senderName}</div>
              <div className="message-text">{message.text}</div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={sendMessage} className="chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-button">Send</button>
      </form>
      
      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay hidden />
    </div>
  );
};

ChatComponent.propTypes = {
  chatMessages: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    sender: PropTypes.string.isRequired,
    senderName: PropTypes.string.isRequired
  })).isRequired,
  newMessage: PropTypes.string.isRequired,
  setNewMessage: PropTypes.func.isRequired,
  sendMessage: PropTypes.func.isRequired,
  voiceChatEnabled: PropTypes.bool.isRequired,
  isConnecting: PropTypes.bool.isRequired,
  toggleVoiceChat: PropTypes.func.isRequired,
  isMuted: PropTypes.bool.isRequired,
  toggleMute: PropTypes.func.isRequired,
  connectionStatus: PropTypes.oneOf(['disconnected', 'waiting', 'connecting', 'connected', 'error']).isRequired,
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired
  }),
  remoteAudioRef: PropTypes.object.isRequired
};

export default ChatComponent; 