# Billing budget alert (optional)
resource "google_billing_budget" "monthly_budget" {
  count = var.billing_account_id != "" ? 1 : 0

  display_name    = "Monthly Budget Alert - ${var.project_id}"
  billing_account = var.billing_account_id

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(var.budget_amount)
    }
  }

  threshold_rules {
    threshold_percent = 0.5
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 0.8
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "CURRENT_SPEND"
  }

  # Note: Notification channels require additional setup
  # For email notifications, you'll need to create a notification channel separately
  all_updates_rule {
    monitoring_notification_channels = []
    pubsub_topic                     = ""
    schema_version                   = "1.0"
  }

  lifecycle {
    prevent_destroy = true
  }
}
