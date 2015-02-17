.._workspaces:

**********
Workspaces
**********
Workspaces are designed to be customizable work environments for Toyz users. A workspace consists
of a set of tiles that can be moved and resized in a browser and linked to a number of different
native tools as well as customizable tools added by the user. Tiles can share data sources, 
allowing interactive plots to be linked to each other or other tiles to make it easier to 
visualize large, high-dimensional data sets.

Workspaces can also be saved so that at a later time the user can reload data sources and tiles
and pick up right where they left off, or share their current work with a collegue who also has
access to their toy application.

Workspaces can be accessed by navigating to ``host:port/workspaces`` or from the main menu
at ``host:port``, choosing the **Toyz** tab and clicking **New Workspace**.

.. note::  

    Sharing workspaces with other users has not been implemented yet

.. _data_sources:

Data Sources
============
To allow multiple plots and other tiles to have their data points linked together, a list of
data sources can be loaded for each workspace. Any tiles that linked to a given data source
will receive updates whenever that data source has changed, for example if points are selected,
added, or removed.

.. _add_data_source:

Adding a Data Source
--------------------
To add a new data source right-click on the workspace area and choose either **Datasources**, 
which will open a dialog that lists all of the current data sources, and clicking the **New** 
button, or choose **new->source** from the context (right-click) menu.

A dialog will pop up to allow you to choose a file from the server. First choose which module you
would like to use for file i/o (currently on ``numpy`` and ``pandas`` are supported). Next choose
a file from the server. If you don't know the path, click on the button labeled ``...`` which 
opens a file dialog. A user can only browse directories that he/she has been given ``find`` or 
``read`` access to.

Depending on the module and file type you choose there will be different options available. There
is currently limited support for different file types and if you would like access to a file
type that is currently unsupported please consider updating Toyz so that other users can benefit.

Once you have finished click ``Open`` to load the file from the server into the current 
workspace. If you have the file dialog open, notice that the source has now been added to the 
list of sources. You can also change the name of the source to something more explicit than 
``data-0``.

Editing or Reloading a Data Source
----------------------------------
If you make changes to a data file and want to repopulate the source with the new data, open the
**Datasources** dialog and choose **Edit**. This will open the source dialog with all of the
options you had previously selected when you opened the source initially. To keep all of the
settings the same just choose **Open**, otherwise make any changes to the input format.

Tiles
=====
Tiles are like mini apps that can be used to display interactive content on the workspace. They
can be linked to data sources or each other, so they are not independent apps, but they are
customizable in that users can shoose their location, dimensions, and even add their own
custom tools.

.. _add_tile:

Adding and Positioning a Tile
-----------------------------
To add a new tile right-click on the workspace area and choose ``new->tile``. The newly
created tile will consist of a dark grey border with a white interior. To re-position the tile
click anywhere on the dark gray border and drag it into position. To resize, theoretically move
the cursor to any corner, but I've found that the bottom right corner works best. When you see
the resize cursor click and drag the tile to the desired dimensions.

Adding Content to a Tile
------------------------
Right-click anywhere in the white part of the tile to open the tile context menu. Notice that it
contains all of the menu options from the workspace wit two additional options: ``Tile Type`` and
``Remove Tile`` (guess what that does). If you move the cursor over ``Tile Type`` it will display
all of the different tile types enabled for the current user. At this time the default tile
types are ``Highcharts``, which are interactive plots, and ``Viewer``, which is an image viewer
capable of displaying large mosaic images. If you have created custom Toyz then your tiles
will also show up in this menu.

For more information on the available tiles see :ref:`highcharts` and :ref:`viewer` .

Loading and Saving a Workspace
==============================
If you have a workspace you would like to save for later use, right-click on the workspace and
choose either ``Save Workspace`` or ``Save Workspace as``. This will prompt you to enter a name
for the workspace. If you choose a name of an existing workspace (that you have created) you will
be alerted and given the chance to rename your workspace.

.. warning::

    When a workspace is saved, only the *configuration* of the tiles and data sources are saved, 
    **Not the content**. This means that if you have a set of plots open and the data source is 
    changed, when you load the workspace it will load the **new data**.

To load a previously saved workspace, first make sure that you have a clean, new workspace by
hitting the reload button in the browser window. This helps prevent memory leaks that may
exist in the code. Then right-click on the workspace and choose ``Load Workspace``. A drop
down menu will appear with all of the available workspaces for the current user id.