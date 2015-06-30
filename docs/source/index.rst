.. Toyz documentation master file, created by
   sphinx-quickstart on Tue Dec 16 11:46:03 2014.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Toyz for Data Reduction and Analysis: Version 0.1
=================================================

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
An initial Toyz release paper was submitted to Astronomy and Computing and uploaded to
arxiv on June 29, 2015.

Most major bug fixes and installation problems have been solved and a small community of
astronomers has begun to use Toyz. Please feel free to drop me a line if you have been
using Toyz and let me know how it has been working.

Future Upgrades
===============
The next major release will attempt to integrate Toyz as a Jupyter (iPython) notebook 
extension. This will significantly simply the initial setup of Toyz, which can take some time
if you are using the same Toyz instance for multiple users.

Affiliated Packages
===================
Below are some of the package that are either completed or in development to be used as 
add-ons to the Toyz framework. If you develop a project of your own please let me know and
I'll add it to the list.

- `Toyz Template <https://github.com/fred3m/toyz-template>`_ is a template for creating custom
    toyz modules compatible with the current framework. It contains simple examples illustrating
    how to use the GUI to build controls and create your own interactive pages or new tiles
    to use on a Toyz workspace

- `Astro Toyz <https://github.com/fred3m/astro-toyz>`_ is the package I'm currently translating
    from the old `astropyp <https://github.com/fred3m/astropyp>`_ format. Some of its features
    will include:
        + Source detection
        + Aperture photometry
        + Interactive editing of point source catalogs
        + Catalog lookups (using astroquery and vizier)
        + Proper motions using specified catalogs

Third Party Software
====================
Creating toyz was only possible due to the open source community, including other projects on
github.

The third party codes currently used in toyz are:
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
A Toyz paper has been written and submitted for publication to Astronomy and Computing.
In the meantime it can be cited at the 
`Astrophysics Source Code Library <http://ascl.net/code/v/1172>`_.

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

