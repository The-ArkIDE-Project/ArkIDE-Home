# ArkIDE Services Incident (1-9-26 to 1-11-26)

## Summary:

On January 9th, 2026, our servers encountered an unknown error at 1:36AM while I (Cosmic, server maintainer and developer of ArkIDE) was asleep. The server then continued to not work and ignore all of my requests for the next 52 hours, until it was finally fixed at 1:30PM on January 11th, 2026.

## What happened?
For the most part, we do not know, but here's what we do know. At approximately 1:36AM APT (advanced package tool) on my debian server, decided that it wanted to reboot to apply some pending changes, and it has never done this before, we think it started doing this just now because of a new stats app that we installed the day before, and when it did this and rebooted, 2 things happened
- 1. The entire network configuration reset
- 2. The server then went on to boot loop for the next 5 hours as it had no display connected

And when the network configuration reset, it broke everything, for the life of me I could not get DHCP or anything else to work until it just decided to work again 2 days later.

## How we fixed it & prevented it from happening again:
Very simple, we just went into the APT configuration, and disabled the auto restart feature after we got everything else set up and working, so hopefully this will not happen again, as I have also reconfigured ALL of my networking and backed all of it up. So if it happens again we have a point to back it up from.

## Our setup at the time:
A few days before I did replace the CPU in the server, but as far as we know that was not the cause. Our full setup was and is the same as penguinmod's, minio for a bunch of the image storing, mongodb for the project storing, and metro¹ for running the server.

## Wrapping up + footnotes
In conclusion, I did learn a lot about how networking works, as before I knew next to nothing, and I learned that I absolutely **NEED** to back up all of my data to my NAS to ensure that this will NEVER happen again. Thank you for using ArkIDE and supporting us during this 52 hour outage of the servers.

Written by Cosmic.

¹: I do not know the exact name of the server we used. It's the same as penguinmod's though.
