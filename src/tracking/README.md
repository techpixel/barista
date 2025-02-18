# Time Tracking

User posts message

--> is the user in the huddle?

    --> is there no active session?
        --> create the session

    --> is there an active session?
        --> add the message to the session

--> is the user not in the huddle?
    --> is there an active session?
        --> end the session
    
    --> is there no active session?
        --> do nothing