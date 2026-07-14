Feature: Login

  Scenario: logs in a user
    Given a user
    When they log in
    Then they are logged in

  Scenario: redirects to the dashboard
    Given a user
    When they log in
    Then they are redirected to the dashboard
