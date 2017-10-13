# Greetings

Super cozy per-character greetings. Supports default greets, greets unique to a
specific person, and greetings that hit no targets. Powerful YAML configuration
allows for reusing greets for multiple cases.

Tries to be smart and emulate standard behavior if it can get a good guess of
who your greeting is going to hit, but if not, it waits to see who it hits
before figuring out what greet to send.

Future plans included:
- figuring out if we can predict 100% of the time who would receive a greet
- manually selecting a greet target to always be hit since collision is lame
- preventing thralls from receiving your greets
