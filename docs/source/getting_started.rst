***************
Getting Started
***************

For a video demonstration of a first time setup, including installing a 3rd party
module (like astrotoyz) see the video below.
.. raw:: html

    <iframe width="420" height="315" src="https://www.youtube.com/embed/v5vYTosb4_U" 
    frameborder="0" allowfullscreen></iframe>


.. _first_time_setup:

First Time Setup
================
Once you have installed toyz (see :ref:`install` for instructions on installation) 
you are ready to setup your local toyz application.

First you need to create a directory that will house the configuration settings, for example
`~/toyz`. Once you've created this directory navigate to it and type ::

    toyz

and you will be promped to setup toyz for the fist time.

.. note::

    You can have more than one instance of a toyz application installed on the same system, and
    even multiple instances running at the same time on different ports.

Once the first time setup has been completed the application will notify you::

    Server is running on port XXXX

where **XXXX** is the port that toyz is using.

To exit the toyz application at any time just type ``CTRL + c``.

.. _running_toyz:

Running a Toyz Application
==========================
There are a number of different ways to initialize a Toyz web application, and even more ways
to connect to a running application. At this time it is recommended that you run Toyz behind a
firewall because we haven't sufficiently vetted the security of the application. Below are some
of the possible ways to initialize and connect to a toyz application (btw, if you are a 
security expert and would like to help make Toyz more secure please stop by the Toyz
`Google group <https://groups.google.com/forum/#!forum/toyz-dev>`_).

.. warning::

    Unless you are running toyz from the default path, you must always run toyz from the
    folder you specified during the first time setup, otherwise toyz won't be able to find
    your saved settings and will once again prompt you for a first time setup.

Remote server behind a firewall
-------------------------------
This is the recommended method to run a Toyz Application. In this case you can use port
forwarding to connect to the remote server, for example, from your local terminal::

    ssh -L<local_port>:localhost:<remote_port> <username>@<hostname>

where **local_port** is the port on the local machine, **remote port** is the port on the 
remote machine, **username** is your username on the server and **hostname** is the server you
are connecting to. For example::

    ssh -L8888:localhost:8888 johndoe@myserver.com

Now navigate to the path where you installed your toyz instance in 
:ref:`first_time_setup` and type::

    toyz --port=<remote_port>

where **remote_port** is the port you specified above. Now open up the browser of your choice
and enter::

    localhost:8888

or replace **8888** with the port your application is currently running on. This should bring you
to a login screen.

Connecting to a Toyz Server Running on a local (or remote) network
------------------------------------------------------------------
If a toyz instance is running on a networked computer, registered
users can log on to the application by entering in their browser::

    hostname:port

where **hostname** is the name of the server hosting the application and **port** is the port
specified when the application was lauched. For example enter::

    physics_server.pas.rochester.edu:8888

in the browser address bar.

Local Machine
-------------
If you are just running toyz on your local machine run::

    toyz --port=8888

where you can replace **8888** with the port you would prefer to use.

.. note::

    The default port is **8888** so it is possible to simply run ``toyz`` from the terminal

Now open up the browser of your choice and enter::

    localhost:8888

or replace **8888** with the port your application is currently running on. This should bring you
to a login screen.

Configuring a New Toyz Web Application
======================================
The first time you log on to Toyz the only account will be the **admin** account, with the 
default password '**admin**'. By default security is turned on so you will be prompted to 
enter '**admin**' for both the name and password.

If you are the only user (for example this is installed on your local machine) you are probably
ready to :ref:`run_first_toy` . Otherwise you will likely need to follow the next few steps
(a more thorough coverage of Toyz settings is given in :ref:`toyz_settings`).

Change Password
---------------
When a new user is created, the default password is always their username, so all users
(including and *ESPECIALLY* the **admin**) are highly recommended to change it to something
more secure. To do this just click on the **change password** button in the
**Account Settings** tab. Enter the current password and the new password twice.

Add New Users and Groups
------------------------
Click on the **User Settings** tab. Scroll down (if necessary) and click on the **new user**
button, then enter the name of a new user. Similarly you go to the **Group Settings** tab and
do the same for new groups.

Modify Permissions for Users and Groups
---------------------------------------
By default all users are given permission to run 
scripts on the **toyz.web.tasks** module and have access to their own personal directory
created on the server. Members of the **admin** group (including the **admin** account)
automatically have permissions for all of the files and directories that the user running
the web application has access to.

If you have just created new accounts, refresh the page and choose a new user from the 
dropdown box to add them to any groups or to give them permission to any additional 
directories or python modules, or toyz installed on the server. 
For example, there may be a shared **images**  directory that all students in a class are 
sharing, or a data analysis toy shared by a research group.

Configuraton Settings
---------------------
There are additional settings that are currently hard coded in the application and cannot be
changed, only viewed, in the config settings menu. All other settings cannot be displayed at
this time.