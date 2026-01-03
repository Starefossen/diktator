variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "europe-north1"
}

variable "bucket_location" {
  description = "The location for the storage bucket (e.g., EU, US, or specific region)"
  type        = string
  default     = "EU"
}

variable "domain" {
  description = "The domain for the application"
  type        = string
  default     = "www.diktator.fn.flaatten.org"
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

# Locals for SSL certificate management
locals {
  managed_domains = tolist([var.domain])
}
