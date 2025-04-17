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
        <div className="chat-container bg-indigo-100">
            <div className="chat-header bg-indigo-100">
                <h3>Game Chat</h3>
                <div className="voice-chat-controls flex items-center space-x-2 bg-indigo-100">
                    <button
                        onClick={toggleVoiceChat}
                        className={`voice-chat-toggle px-3 py-1.5 rounded-md text-sm font-medium transition-all ${voiceChatEnabled
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                            } ${connectionStatus === 'connecting' ? 'opacity-75 cursor-wait' : ''}`}
                        disabled={connectionStatus === 'connecting'}
                    >
                        {connectionStatus === 'connecting' ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Connecting...
                            </span>
                        ) : voiceChatEnabled ? 'Disable Voice' : 'Enable Voice'}
                    </button>

                    {voiceChatEnabled && (
                        <button
                            onClick={toggleMute}
                            className={`mute-button px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isMuted
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                }`}
                            disabled={connectionStatus !== 'connected'}
                        >
                            <span className="flex items-center">
                                {isMuted ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                        Unmute
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                        Mute
                                    </>
                                )}
                            </span>
                        </button>
                    )}

                    {voiceChatEnabled && (
                        <div className={`connection-status px-2.5 py-1 rounded-full text-xs font-medium ${connectionStatus === 'disconnected' ? 'bg-gray-200 text-gray-800' :
                            connectionStatus === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                connectionStatus === 'connecting' ? 'bg-blue-100 text-blue-800' :
                                    connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                                        'bg-red-100 text-red-800'
                            }`}>
                            <span className="flex items-center">
                                <span className={`h-2 w-2 rounded-full mr-1.5 ${connectionStatus === 'disconnected' ? 'bg-gray-500' :
                                    connectionStatus === 'waiting' ? 'bg-yellow-500' :
                                        connectionStatus === 'connecting' ? 'bg-blue-500 animate-pulse' :
                                            connectionStatus === 'connected' ? 'bg-green-500' :
                                                'bg-red-500'
                                    }`}></span>
                                {connectionStatus === 'disconnected' && 'Disconnected'}
                                {connectionStatus === 'waiting' && 'Waiting for opponent...'}
                                {connectionStatus === 'connecting' && 'Connecting...'}
                                {connectionStatus === 'connected' && 'Connected'}
                                {connectionStatus === 'error' && 'Connection Error'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            <div className="chat-messages bg-indigo-100">
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
                <button type="submit" className="chat-send-button">
                    Send
                </button>
            </form>

            <audio ref={remoteAudioRef} autoPlay playsInline hidden />
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