********
Overview
********

What is Toyz?
=============
Toyz was initially created as a way to view and interact with FITS images stored on a remote 
server, as well as perform data reduction needed for my PhD. I couldn't find any easy to use
and well documented astronomy tools for this task so I set out to create my own application.

In a nutshell Toyz is a web application framework designed to meet the needs of "Big Data"
scientists by allowing them to interact with their data via a web browser and run
scripts on a remote server that stores their data (and perhaps a gpu cluster).
There are a few simple ideas that have been (and will continue to be) essential to the
development of toyz (think of it as a mission statement): 
    1. It should be easy to install with as few dependencies as possible
    2. It should take up a minimal amount of disk space
    3. It should be well documented and easy to user
    4. An undergraduate summer REU student should be able to start analyzing data with
       it on his/her first day!

Toyz uses a python `Tornado <http://www.tornadoweb.org/en/stable/>`_ web application that 
can run scripts in any language, provided they are either wrapped in python or can be
run from a shell statement. Some basic tools are included in the Toyz package but it has
been designed to be completely customizable by users to suit their needs.

On the client side a simple framework has been created to allow users to easily create UI's
with a minimal amount of javascript experience. In theory Toyz can be run from any modern 
web browser (Firefox, Chrome, Opera, Safari) with no install necessary on the client machine.

Possible Use Cases
==================
The primary use case Toyz was designed for was a group of researchers accessing a large set of
shared data that is impractical to store on their local machines while allowing them to interact
with the data as if it was installed locally, however toyz can easily be installed on a 
laptop or desktop computer.

In addition the code has been designed for more advanced scenarios. For example, a class on
data analysis in some subject (for example observational astronomy). Each member of the class
can be given an account in the toyz application that will be accessible only to them, where
they can store their data and any files generated from their data reduction. This even includes
simulations that can be run on the server, allowing teachers to use a mugh larger set of tools to
instruct their class without the hassle of having 30 students trying to install software on
30 different machines with various operating systems and configurations.

Another scenario is a much larger collaboration, where researchers are sharing data and analysis]
with collaborators located all over the world. Toyz includes workspaces that allow for multiple
plots (whose points are all connected) to be shared between users and groups, or for a single
user to save his/her workspace for future analysis.

Third Party Software
====================
Creating toyz was only possible due to the open source community, including other projects on
github.

The third party codes currently used in toyz are:
    - `loadpng <http://lodev.org/lodepng/>`_
    - `jquery <http://jquery.com/>`_
    - `jquery UI <http://jqueryui.com/>`_
    - `Graph 3d <http://almende.github.io/chap-links-library/js/graph3d/doc/>`_
    - `Google visual <https://developers.google.com/chart/interactive/docs/reference>`_