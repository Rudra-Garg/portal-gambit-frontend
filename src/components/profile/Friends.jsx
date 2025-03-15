import React, { useState } from 'react';

const Friends = () => {
  const [friends, setFriends] = useState([
    { id: 1, name: 'AliceChess42', status: 'online', Matches: 1850 },
    { id: 2, name: 'BobKnight', status: 'offline', Matches: 1720 },
    { id: 3, name: 'CharlieRook', status: 'playing', Matches: 2105 }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [friendRequest, setFriendRequest] = useState('');

  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFriend = () => {
    if (friendRequest.trim()) {
      alert(`Friend request sent to ${friendRequest}`);
      setFriendRequest('');
    }
  };

  const removeFriend = (id) => {
    setFriends(friends.filter(friend => friend.id !== id));
  };

  const inviteToGame = (friendName) => {
    alert(`Invited ${friendName} to a game`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'playing': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg min-h-[500px] border border-gray-100">
      {/* Header */}
      <h2 className="text-2xl font-bold text-indigo-700 mb-6">Friends</h2>
      
      {/* Add Friend & Search */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add friend by username"
            value={friendRequest}
            onChange={(e) => setFriendRequest(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-800"
          />
          <button 
            onClick={handleAddFriend}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Add
          </button>
        </div>
        
        <input
          type="text"
          placeholder="Search friends..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-800"
        />
      </div>

      {/* Friends List */}
      <div className="space-y-3 overflow-y-auto max-h-64">
        {filteredFriends.map(friend => (
          <div key={friend.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200">
            {/* Friend Info */}
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(friend.status)} ring-2 ring-white mr-3`}></div>
              <div>
                <div className="font-medium text-gray-900">{friend.name}</div>
                <div className="text-xs text-gray-500">Matches: {friend.Matches}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => inviteToGame(friend.name)}
                className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                Invite
              </button>
              <button 
                onClick={() => removeFriend(friend.id)}
                className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {filteredFriends.length === 0 && (
          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
            No friends found
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;