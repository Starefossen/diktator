variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "europe-north1"
}

variable "billing_account_id" {
  description = "The billing account ID for budget alerts (optional)"
  type        = string
  default     = ""
}

variable "budget_amount" {
  description = "Monthly budget amount in USD for alerts"
  type        = number
  default     = 50
}

variable "alert_email" {
  description = "Email address for billing alerts (optional)"
  type        = string
  default     = ""
}
