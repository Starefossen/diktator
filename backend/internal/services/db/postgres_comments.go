package db

// This file contains placeholder documentation for exported Postgres methods.
// The actual implementations are in postgres.go.
// These methods implement the Repository interface defined in interface.go.

// GetUser retrieves a user by ID.
// GetUserByAuthID retrieves a user by authentication ID.
// GetUserByEmail retrieves a user by email address.
// LinkUserToAuthID links a user account to an authentication provider ID.
// CreateUser creates a new user account.
// UpdateUserDisplayName updates a user's display name.
// UpdateUser updates a user's information.
// DeleteUser deletes a user account.

// GetFamily retrieves family information by ID.
// CreateFamily creates a new family.
// AddFamilyMember adds a user to a family with a specific role.
// UpdateFamily updates family information.
// DeleteFamily deletes a family and all associated data.

// GetChild retrieves a child account by ID.
// GetFamilyChildren retrieves all children in a family.
// CreateChild creates a new child account.
// UpdateChildDisplayName updates a child's display name.
// UpdateChildBirthYear updates a child's birth year.
// UpdateChild updates child information.
// DeleteChild deletes a child account.

// GetWordSet retrieves a word set with all words and translations.
// GetWordSets retrieves all word sets for a family.
// GetGlobalWordSets retrieves all global (curated) word sets.
// CreateWordSet creates a new word set.
// UpdateWordSet updates an existing word set.
// DeleteWordSet deletes a word set.

// GetTestResults retrieves all test results for a user.
// GetFamilyResults retrieves all test results for a family.
// SaveTestResult saves a test result.

// GetAudioFile retrieves cached audio file metadata.
// SaveAudioFile saves audio file metadata to cache.

// GetFamilyProgress retrieves progress statistics for all family members.
// GetFamilyStats retrieves aggregate statistics for a family.
// GetUserProgress retrieves progress statistics for a specific user.

// CreateFamilyInvitation creates a new family invitation.
// GetPendingInvitationsByEmail retrieves pending invitations for an email address.
// GetFamilyInvitations retrieves all invitations for a family.
// AcceptInvitation accepts a family invitation.
// DeleteInvitation deletes a family invitation.

// VerifyFamilyMembership verifies a user belongs to a family.
// VerifyParentPermission verifies a user has parent permissions in a family.
// VerifyChildOwnership verifies a parent owns a specific child account.
// VerifyWordSetAccess verifies a family has access to a word set.

// AssignWordSetToUser assigns a word set to a user.
// UnassignWordSetFromUser removes a word set assignment from a user.
// GetWordSetAssignments retrieves all users assigned to a word set.
