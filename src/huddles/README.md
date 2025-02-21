# flow v2

## userJoinedHuddle
user joins the huddle --> is there an active session?
    - yes
        --> user joins the session

    - yes but the session is paused
        --> start the session

    - no
        --> user waits for the session to start
        
## userLeftHuddle
user leaves the huddle --> is there an active session?
    - yes
        --> pause the session
        --> wait for a ship post
    
    - no
        --> do nothing :shrug: