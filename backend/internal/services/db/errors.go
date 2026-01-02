package db

import "errors"

// Common database errors
var (
	ErrNotFound          = errors.New("record not found")
	ErrDuplicate         = errors.New("duplicate record")
	ErrPermissionDenied  = errors.New("permission denied")
	ErrInvalidInput      = errors.New("invalid input")
	ErrFamilyNotFound    = errors.New("family not found")
	ErrUserNotFound      = errors.New("user not found")
	ErrChildNotFound     = errors.New("child not found")
	ErrWordSetNotFound   = errors.New("word set not found")
	ErrNotFamilyMember   = errors.New("not a member of this family")
	ErrNotParent         = errors.New("user is not a parent in this family")
	ErrNotChildOwner     = errors.New("user does not own this child account")
	ErrNoAccess          = errors.New("no access to this resource")
	ErrConnectionFailed  = errors.New("database connection failed")
	ErrTransactionFailed = errors.New("transaction failed")
)
