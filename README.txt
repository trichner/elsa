VLC Visualizer
===========================

Setup:
- install node.js (google->download->install)
- install all the packages in js/node_setup.sh (on linux you may just run the script)


Run it:
- start it as root, otherwise serial ports and webserver on port 80 will fail
- browse to 'localhost' or the host's IP, for best results use google-chrome (it also works from remote)
- on windows: open root shell, run 'node server.js'
- on linux: 'sudo nodejs server.js'


Webpage:
- you can setup the devices on the lower half of the page, no input will try to setup with
  the default values

Known Issues:
- with some configurations, setup may fail (especially if you select many devices)
- some errors are not recoverable, which kills the server
- maximum 8 devices are detected on linux (at least on my laptop) instead of all 12

Hints:
- sometimes you might have to reload the page to make it work
- the animation always has the size of the window at load, if you want it fullscreen first
  make the window fullscreen and then reload the page