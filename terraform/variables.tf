variable "project_id" {
  description = "The GCP project ID for Text-to-Speech service"
  type        = string
}

variable "region" {
  description = "The GCP region for Text-to-Speech service"
  type        = string
  default     = "europe-north1"
}

variable "billing_account_id" {
  description = "The billing account ID for TTS usage budget alerts (optional)"
  type        = string
  default     = ""
}

variable "budget_amount" {
  description = "Monthly TTS API budget amount in USD for alerts"
  type        = number
  default     = 50
}

variable "alert_email" {
  description = "Email address for billing alerts (optional)"
  type        = string
  default     = ""
}
