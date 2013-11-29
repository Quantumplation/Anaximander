Anaximander
===========

Neptunes Pride strategic mapping tool - 

http://en.wikipedia.org/wiki/Anaximander
Anaximander is considered one of the first people to try and map the known world.


With 64 players, shits gunna get tough.
We'll need proper strategic tooling.

Ideas
======

Not all of these have to get implemented, but each one would be nice.

 - ~~Chrome extension which, every hour on the hourly tick, gets the NP JSON dump and POST's it to Anaximander.~~ Thanks to Rob.
 - ~~Take a json dump and update the map with it, merging reports from several players.~~ Thanks to Rob and Pi
 - ~~Provide a history~~ slider Thanks to Rob and Pi
 - Tactical overlays: Econ/Industry/Tech/Fleet/Resources heatmaps, etc.  We can use http://www.patrick-wied.at/static/heatmapjs/ for this pretty easily.
 - Webhook Notifications for specific triggers.  We can tie these up using zapier to email, text, etc.
   + Enemy star rises above a certain industry. (Long live SpaceDetroit!)
   + Enemy fleet above a certain threshold of ships enters view.
   + Enemy fleet launches with your star as a destination.
 - Calculating how many ships a fleet will have when it reaches its destination by taking into account industry.
 - Strategic planning capabilities
   - Multi-stop combat planning, showing rough estimates of survivors at each step, taking into account industry
 - Alliance detection
   - Player A's ships land on Player B's star, but star count goes up.
   - Statistical probability that people are allies: W gets tech from X within Y hours of researching it Z percent of the time.
 - Overlapping research warning / planner/optimiztion.
 - Unspent money nearing tick warning
 - See allies unspent money to coordinate resource trades / lending
 - See who has reported this tick and who hasn't
