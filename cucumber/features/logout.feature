Feature: Logout

  Scenario: logs out the user
    Given a logged in user
    When they log out
    Then they are logged out
