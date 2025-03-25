import React, { useState, useContext, useEffect, useRef } from 'react';
// Make sure this import matches your actual context path
import AuthContext from "../../contexts/AuthContext";
import { fetchProfileDetails } from "../../utils/profileUtils";

const Friends = () => {
  // Existing state and context
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [friendRequest, setFriendRequest] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState(null);
  const [requestProfiles, setRequestProfiles] = useState({});

  // New state for username search functionality
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [sendingRequests, setSendingRequests] = useState({});

  // Ref for search input to track outside clicks
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  // Debounce timeout ref
  const searchTimeout = useRef(null);

  // Handle clicks outside search dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target) &&
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search effect with friend filtering
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Don't search if input is empty
    if (!friendRequest.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Set a new timeout for the search
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          throw new Error('No access token found');
        }

        const response = await fetch(`http://localhost:8000/profiles/search/${friendRequest}?limit=10`, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to search profiles');
        }

        const data = await response.json();

        // Filter out users who are already friends
        const existingFriendIds = friends.map(friend => friend.id);
        const filteredResults = data.filter(profile => !existingFriendIds.includes(profile.uid));

        setSearchResults(filteredResults);
        setShowSearchResults(true);
      } catch (err) {
        console.error('Error searching profiles:', err);
        setSearchError('Failed to search users');
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce timeout

    // Cleanup function
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [friendRequest, friends]); // Added friends dependency

  // Send friend request function
  const sendFriendRequest = async (receiverId) => {
    // Prevent duplicate requests
    if (sendingRequests[receiverId]) return;

    try {
      setSendingRequests(prev => ({ ...prev, [receiverId]: true }));

      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch('http://localhost:8000/friends/requests', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          receiver_id: receiverId,
          message: "added friend via username search"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send friend request');
      }

      // Success handling - show feedback to user
      alert(`Friend request sent successfully!`);

      // Clear search
      setFriendRequest('');
      setSearchResults([]);
      setShowSearchResults(false);
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert('Failed to send friend request. Please try again.');
    } finally {
      setSendingRequests(prev => ({ ...prev, [receiverId]: false }));
    }
  };

  // Fetch friends list
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;

      setIsFriendsLoading(true);
      setFriendsError(null);

      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          throw new Error('No access token found');
        }

        const response = await fetch('http://localhost:8000/friends/list', {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch friends list');
        }

        const friendships = await response.json();

        // Process each friendship entry
        const friendsData = [];
        for (const friendship of friendships) {
          // Skip entries where user is their own friend (self-friendship)
          if (friendship.user_id === friendship.friend_id) continue;

          // Fetch profile details for the friend
          const profileData = await fetchProfileDetails(friendship.friend_id);

          if (profileData) {
            friendsData.push({
              id: friendship.friend_id,
              name: profileData.display_name || profileData.username,
              status: 'online', // Default status, would be updated with real status if available
              Matches: profileData.games_played || 0,
              rating: profileData.rating || 1200,
              wins: profileData.wins || 0,
              losses: profileData.losses || 0,
              draws: profileData.draws || 0,
              friendship: {
                since: friendship.became_friends,
                gamesPlayed: friendship.games_played,
                lastGame: friendship.last_game,
                lastInteraction: friendship.last_interaction
              }
            });
          }
        }

        setFriends(friendsData);
      } catch (err) {
        console.error('Error fetching friends list:', err);
        setFriendsError('Failed to load friends');
      } finally {
        setIsFriendsLoading(false);
      }
    };

    if (user) {
      fetchFriends();
    }
  }, [user]);

  // Existing effect for fetching pending requests stays the same
  useEffect(() => {
    const fetchPendingRequests = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          throw new Error('No access token found');
        }

        const response = await fetch('http://localhost:8000/friends/requests/pending', {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch pending requests');
        }

        const data = await response.json();
        // Filter requests meant for the current user
        const userRequests = data.filter(req => req.receiver_id === user.uid);
        setPendingRequests(userRequests);

        // Fetch profile details for each sender
        const profiles = {};
        for (const request of userRequests) {
          if (request.status === "pending") {
            const profileData = await fetchProfileDetails(request.sender_id);
            if (profileData) {
              profiles[request.sender_id] = profileData;
            }
          }
        }
        setRequestProfiles(profiles);
      } catch (err) {
        console.error('Error fetching pending requests:', err);
        setError('Failed to load friend requests');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPendingRequests();
    }
  }, [user]);

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFriend = () => {
    if (friendRequest.trim()) {
      alert(`Friend request sent to ${friendRequest}`);
      setFriendRequest('');
    }
  };

  // Updated to properly handle friend removal with API request
  const removeFriend = async (friendId) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // Show confirmation dialog
      if (!window.confirm("Are you sure you want to remove this friend?")) {
        return;
      }

      // Make the DELETE request to remove the friend
      const response = await fetch(`http://localhost:8000/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove friend');
      }

      // Update the UI by removing the friend from the list
      setFriends(friends.filter(friend => friend.id !== friendId));
      alert('Friend removed successfully');
    } catch (err) {
      console.error('Error removing friend:', err);
      alert('Failed to remove friend. Please try again.');
    }
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

  // Updated respond to request function to use profile data
  const respondToRequest = async (requestId, accept) => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      const response = await fetch(`http://localhost:8000/friends/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          request_id: requestId,
          accept: accept
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${accept ? 'accept' : 'reject'} request`);
      }

      // If successful, remove the request from pending list
      setPendingRequests(pendingRequests.filter(req => req.request_id !== requestId));

      // If accepted, add to friends list with rich profile data
      if (accept) {
        const request = pendingRequests.find(req => req.request_id === requestId);
        if (request) {
          const profileData = requestProfiles[request.sender_id];
          setFriends([...friends, {
            id: request.sender_id,
            name: profileData ? profileData.display_name || profileData.username : 'Unknown User',
            status: 'online',
            Matches: profileData ? profileData.games_played : 0,
            rating: profileData ? profileData.rating : 1200,
            wins: profileData ? profileData.wins : 0,
            losses: profileData ? profileData.losses : 0,
            draws: profileData ? profileData.draws : 0
          }]);
        }
      }
    } catch (err) {
      console.error(`Error ${accept ? 'accepting' : 'rejecting'} request:`, err);
      alert(`Failed to ${accept ? 'accept' : 'reject'} friend request. Please try again.`);
    }
  };

  const acceptRequest = (requestId) => {
    respondToRequest(requestId, true);
  };

  const declineRequest = (requestId) => {
    respondToRequest(requestId, false);
  };

  // Only show requests with "pending" status
  const filteredPendingRequests = pendingRequests.filter(req => req.status === "pending");

  return (
    <div className="bg-white rounded-b-xl p-6 shadow-lg border border-gray-100">
      {/* Header */}
      <h2 className="text-2xl font-bold text-indigo-700 mb-6">Friends</h2>

      {/* Add Friend & Search - Updated with search dropdown */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for users to add..."
            value={friendRequest}
            onChange={(e) => setFriendRequest(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowSearchResults(true);
              }
            }}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-800"
          />

          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute right-3 top-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div
              ref={searchResultsRef}
              className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200 max-h-80 overflow-y-auto"
            >
              {searchError ? (
                <div className="p-3 text-center text-red-500">
                  {searchError}
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(profile => (
                  <div
                    key={profile.uid}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex-grow">
                      <div className="font-medium text-gray-900">
                        {profile.display_name || profile.username}
                      </div>
                      <div className="text-xs text-gray-600">
                        Rating: {profile.rating}
                      </div>
                      <div className="text-xs text-gray-500">
                        Games: {profile.games_played} (W: {profile.wins} L: {profile.losses} D: {profile.draws})
                      </div>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(profile.uid)}
                      disabled={sendingRequests[profile.uid]}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors 
                        ${sendingRequests[profile.uid]
                          ? 'bg-gray-400 text-white'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                      {sendingRequests[profile.uid] ? 'Sending...' : 'Add'}
                    </button>
                  </div>
                ))
              ) : friendRequest.trim() !== '' ? (
                <div className="p-3 text-center text-gray-500">
                  No users found
                </div>
              ) : null}
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Search friends..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-gray-800"
        />
      </div>

      {/* Pending Friend Requests Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowPendingRequests(!showPendingRequests)}
          className="flex items-center w-full justify-between px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors duration-200 mb-2"
        >
          <span>Friend Requests ({filteredPendingRequests.length})</span>
          <span>{showPendingRequests ? '▲' : '▼'}</span>
        </button>

        {showPendingRequests && (
          <div className="space-y-3 mt-3">
            {isLoading ? (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                Loading requests...
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-500 bg-red-50 rounded-lg">
                {error}
              </div>
            ) : filteredPendingRequests.length > 0 ? (
              filteredPendingRequests.map(request => {
                const profileData = requestProfiles[request.sender_id];
                return (
                  <div key={request.request_id} className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg shadow-sm border border-indigo-100">
                    <div>
                      <div className="font-medium text-gray-900">
                        {profileData ? profileData.display_name || profileData.username : 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-600">
                        Rating: {profileData ? profileData.rating : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {profileData ?
                          `Games: ${profileData.games_played} (W: ${profileData.wins} L: ${profileData.losses} D: ${profileData.draws})` :
                          'No stats available'}
                      </div>
                      {request.message && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          "{request.message}"
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(request.request_id)}
                        className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-md hover:bg-green-600 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineRequest(request.request_id)}
                        className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-lg">
                No pending friend requests
              </div>
            )}
          </div>
        )}
      </div>

      {/* Friends List */}
      <div>
        <h3 className="text-lg font-semibold text-indigo-600 mb-3">My Friends</h3>
        <div className="space-y-3 overflow-y-auto max-h-64">
          {isFriendsLoading ? (
            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
              Loading friends...
            </div>
          ) : friendsError ? (
            <div className="text-center py-4 text-red-500 bg-red-50 rounded-lg">
              {friendsError}
            </div>
          ) : filteredFriends.length > 0 ? (
            filteredFriends.map(friend => (
              <div key={friend.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200">
                {/* Friend Info */}
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(friend.status)} ring-2 ring-white mr-3`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{friend.name}</div>
                    <div className="text-xs text-gray-600">Rating: {friend.rating}</div>
                    <div className="text-xs text-gray-500">
                      Games: {friend.Matches} (W: {friend.wins} L: {friend.losses} D: {friend.draws})
                    </div>
                    <div className="text-xs text-gray-400">
                      Friends since: {new Date(friend.friendship?.since).toLocaleDateString()}
                    </div>
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
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
              No friends found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;