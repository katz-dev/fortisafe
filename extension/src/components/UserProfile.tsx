import React from 'react';
import { Link } from 'react-router-dom';

interface UserProfileProps {
    userData: any;
}

const UserProfile: React.FC<UserProfileProps> = ({ userData }) => {
    if (!userData) {
        return <div className="loading-container">Loading user data...</div>;
    }

    const email = userData?.user?.email || userData?.email || '';
    const firstName = userData?.user?.firstName || userData?.auth0Profile?.given_name || '';
    const lastName = userData?.user?.lastName || userData?.auth0Profile?.family_name || '';
    const picture = userData?.user?.picture || userData?.auth0Profile?.picture || '';
    const displayName = firstName || email.split('@')[0] || 'User';

    return (
        <div className="profile-container">
            <header className="header">
                <h1>User Profile</h1>
                <div className="user-info">
                    <span>Hello, {displayName}!</span>
                </div>
            </header>

            <div className="profile-content">
                {picture && (
                    <div className="profile-image">
                        <img src={picture} alt="Profile" />
                    </div>
                )}

                <div className="profile-details">
                    <div className="profile-item">
                        <label>Name:</label>
                        <span>{firstName} {lastName}</span>
                    </div>

                    <div className="profile-item">
                        <label>Email:</label>
                        <span>{email}</span>
                    </div>

                    {userData?.user?.id && (
                        <div className="profile-item">
                            <label>User ID:</label>
                            <span>{userData.user.id}</span>
                        </div>
                    )}
                </div>

                <div className="profile-actions">
                    <Link to="/home" className="back-button">Back to Home</Link>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
