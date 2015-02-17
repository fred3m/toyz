.. Toyz documentation master file, created by
   sphinx-quickstart on Tue Dec 16 11:46:03 2014.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Toyz for Data Reduction and Analysis
====================================

Contents:

**Introduction to Toyz**

.. toctree::
    :maxdepth: 3

    overview.rst
    install.rst
    getting_started.rst
    
**Workspaces and Tiles**

.. toctree::
    :maxdepth: 3
    
    workspaces.rst
    viewer.rst
    highcharts.rst

**Creating Custom Toyz**

.. toctree::
    :maxdepth: 3
    
    custom_toyz.rst
    toyz_api.rst
    web_gui.rst

**Contributing to the Toyz Project**

.. toctree::
    :maxdepth: 3
    
    contributing.rst

Screenshots
===========
Visit the `github page <https://github.com/fred3m/toyz>`_ to see some sample screenshots 
from Toyz (and Astropyp/Astro pypelines that will soon be converted to Toyz in the coming weeks).

Recent Developements
====================
As of mid-February Toyz is very nearly complete! The GUI, DB, and file access API-s are locked 
for version 0.0 and the API for custom toyz modules is stable and not likley to change.

There are a number of minor bug fixes that should take place over the next few weeks as well
as improvements to the documentation. Once these are completed I'll push version 0.0 to
PyPi so toyz can be installed via `pip <https://pypi.python.org/pypi/pip>`_ .

Affiliated Packages
===================
Below are some of the package that are either completed or in development to be used as 
add-ons to the Toyz framework. If you develop a project of your own please let me know and
I'll add it to the list.

- `Toyz Template <https://github.com/fred3m/toyz-template>`_ is a template for creating custom
    toyz modules compatible with the current framework. It contains simple examples illustrating
    how to use the GUI to build controls and create your own interactive pages or new tiles
    to use on a Toyz workspace

- `Toyz Studio <https://github.com/fred3m/toyz-studio>`_ is going to be an IDE similar to 
    `R-studio <http://www.rstudio.com/>`_ for R and 
    `spyder <https://code.google.com/p/spyderlib/>`_ for python, only it will run in a 
    browser using the Toyz framework. This will allow users to edit code on the server as well as
    interact with a python command line (similar to iPython).

- `Astro Toyz <https://github.com/fred3m/astro-toyz>`_ is the package I'm currently translating
    from the old `astropyp <https://github.com/fred3m/astropyp>`_ format. Some of its features
    will include:
        + Source detection
        + Aperture photometry
        + Interactive editing of point source catalogs
        + Catalog lookups (using astroquery and vizier)
        + Proper motions using specified catalogs
    
- `DECam Tools`_ will be an interactive version of the command line tools I'm currently using
    to reduce data from the dark energy camera (DECam). Some of its key features are:
        + Building an index to keep track of raw images and their post-processing counterparts
        + Source detection and aperture photometry
        + Color corrections for instrumental magnitudes
        + Photometric calibration with standard fields using astroquery

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
      (not bundled with code but linked from software)
    - `jQuery contextMenu <http://medialize.github.io/jQuery-contextMenu/index.html>`_
    - `Highcharts <http://www.highcharts.com>`_
      (not bundled with code but linked from software)

Citing Toyz
===========
I'm in the process of writing the paper on Toyz. If you use this code for your research
please be a good citizen and cite that paper once it's available. It's been a lot of work
putting this together but I'm hoping it contributes to a lot of good science.

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

