A node API service which will check if the passed username is a mod of the passed along twitch channel.
This code is still alpha, expect bugs and bad code. I will do some clean up as I can be arse.

I needed a quick, dirty and simple way to check if a user is a mod of a channel on Twitch, sure I could of used the mod api from twitch but that requires scopes and refreshing auth tokens. such a pain in the arse. But we can pull a list of the mods from TMI using a long life chat oauth token, so this thing mantains a connection to tmi and returns a list of the mods of a channel on demand. Thought fuck it, might as well post the code to GH.

/:channel returns a list of the mods of a channel
/:channel/:user checks if :user is a mod of :channel. if yes returns 200 if no returns 404
