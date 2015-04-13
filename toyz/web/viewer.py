# Copyright 2015 by Fred Moolekamp
# License: LGPLv3
from __future__ import print_function, division
from collections import OrderedDict
from toyz.utils.errors import ToyzJobError
import math
import os
import numpy as np
from toyz.utils import core
from toyz.web import session_vars

# Set the default values for the sessions global variables if they have not already been set
viewer_variables = {
    'filepath': None,
    'img_file': None,
}
for v in viewer_variables:
    if not hasattr(session_vars, v):
        setattr(session_vars, v, viewer_variables[v])

# It may be desirabe in the future to allow users to choose what type of image they
# want to send to the client. For now the default is sent to jpg, since it is the
# smallest image type.
img_formats = {
    'png': 'PNG',
    'bmp': 'BMP',
    'eps': 'EPS',
    'gif': 'GIF',
    'im': 'IM',
    'jpg': 'JPEG',
    'j2k': 'JPEG 2000',
    'msp': 'MSP',
    'pcx': 'PCX',
    'pbm': 'PBM',
    'pgm': 'PGM',
    'ppm': 'PPM',
    'spi': 'SPIDER',
    'tiff': 'TIFF',
    'webp': 'WEBP',
    'xbm': 'XBM'
}

def import_fits():
    try:
        import astropy.io.fits as pyfits
    except ImportError:
        try:
            import pyfits
        except ImportError:
            raise ToyzJobError(
                "You must have astropy or pyfits installed to view FITS images")
    return pyfits

def get_file(file_info):
    """
    If the image has already been loaded into memory, access it here.
    Otherwise, store the image for later use
    """
    if session_vars.filepath == file_info['filepath']:
        img_file = session_vars.img_file
    else:
        print('loading', file_info['filepath'])
        if file_info['ext'].lower() == 'fits' or file_info['ext'].lower() == 'fits.fz':
            pyfits = import_fits()
            img_file = pyfits.open(file_info['filepath'])
        else:
            try:
                from PIL import Image
            except ImportError:
                raise ToyzJobError(
                    "You must have PIL (Python Imaging Library) installed to "
                    "open files of this type"
                )
            img_file = Image.open(file_info['filepath'])
        session_vars.filepath = file_info['filepath']
        session_vars.img_file = img_file
    return img_file

def get_file_info(file_info):
    file_split = file_info['filepath'].split('.')
    file_info['filename'] = os.path.basename(file_split[0])
    file_info['ext'] = '.'.join(file_split[1:])
    
    if 'tile_width' not in file_info:
        file_info['tile_width'] = 400
    if 'tile_height' not in file_info:
        file_info['tile_height'] = 200
    if 'img_type' not in file_info:
        file_info['img_type'] == 'image'
    
    if file_info['ext'].lower() == 'fits' or file_info['ext'].lower() == 'fits.fz':
        file_info['file_type'] = 'img_array'
        hdulist = get_file(file_info)
        file_info['hdulist'] = [hdu.__class__.__name__ for hdu in hdulist]
        if 'images' not in file_info:
            if len(hdulist)>1:
                file_info['images'] = OrderedDict(
                    [[str(n), {'frame': str(n)}] for n, hdu in enumerate(hdulist)
                    if 'imagehdu' in hdu.__class__.__name__.lower()])
            else:
                file_info['images'] = {
                    '0': {'frame': '0'}
                }
        if len(file_info['images']) == 0:
            raise ToyzJobError("FITS file does not contain any recognized image hdu's")
    else:
        file_info['file_type'] = 'img'
        file_info['images'] = {'0':{'frame': '0'}}
    
    file_defaults = {
        'frame': next(iter(file_info['images'])),
        'resampling': 'NEAREST',
        'invert_x': False,
        'invert_y': False,
        'tile_format': 'png',
        'colormap': {
            'name': 'Spectral',
            'color_scale': 'linear',
            'invert_color': False,
            'set_bounds': False
        }
    }
    
    for default in file_defaults:
        if default not in file_info:
            file_info[default] = file_defaults[default]
    
    return file_info

def get_window(viewer):
    viewer['left']=int(viewer['x_center']-viewer['width']/2)
    viewer['bottom']=int(viewer['y_center']+viewer['height']/2)
    viewer['right']=int(viewer['left']+viewer['width'])
    viewer['top']=int(viewer['bottom']-viewer['height'])
    return viewer

def get_best_fit(data_width, data_height, img_viewer):
    # Make the image slightly smaller than the viewer size, to account for 
    # slight differences in the image height/width from the desired
    # tiles sizes
    x_scale = img_viewer['width']/data_width*.97
    y_scale = img_viewer['height']/data_height*.97
    scale = min(y_scale, x_scale)
    img_viewer['x_center'] = int(math.floor(data_width/2*scale))
    img_viewer['y_center'] = int(math.floor(data_height/2*scale))
    img_viewer['scale'] = scale
    img_viewer = get_window(img_viewer)
    return img_viewer

def get_img_info(file_info, img_info):
    if file_info['ext'].lower() == 'fits' or file_info['ext'].lower() == 'fits.fz':
        hdulist = get_file(file_info)
        data = hdulist[int(img_info['frame'])].data
        height, width = data.shape
        
        if('colormap' not in img_info):
            if(file_info['colormap']['set_bounds']):
                px_min = file_info['px_min']
                px_max = file_info['px_max']
            else:
                px_min = float(data.min())
                px_max = float(data.max())
            img_info['colormap'] = file_info['colormap']
            if not file_info['colormap']['set_bounds']:
                img_info['colormap']['px_min'] = float(data.min())
                img_info['colormap']['px_max'] = float(data.max())
    else:
        # For non-FITS formats, only a single large image is loaded, which 
        try:
            from PIL import Image
        except ImportError:
            raise ToyzJobError(
                "You must have PIL (Python Imaging Library) installed to "
                "open files of this type"
            )
        img = get_file(file_info)
        img_info['colormap'] = {
            'name': 'none',
            'px_min': 0,
            'px_max': 255,
            'invert_color': False
        }
        width, height = img.size
    img_info['width'] = width
    img_info['height'] = height
    
    if 'scale' not in img_info:
        if 'viewer' not in img_info or 'scale' not in img_info['viewer']:
            raise ToyzJobError("You must either supply a scale or image viewer parameters")
        if img_info['viewer']['scale']<0:
            img_info['viewer'] = get_best_fit(width, height, img_info['viewer'])
        else:
            img_info['viewer'] = get_window(img_info['viewer'])
    else:
        img_info['viewer'] = get_window(img_info['viewer'])
    img_info['scale'] = img_info['viewer']['scale']
    img_info['scaled_width'] = int(math.ceil(width*img_info['scale']))
    img_info['scaled_height'] = int(math.ceil(height*img_info['scale']))
    img_info['columns'] = int(math.ceil(img_info['scaled_width']/file_info['tile_width']))
    img_info['rows'] = int(math.ceil(img_info['scaled_height']/file_info['tile_height']))
    
    img_defaults = {
        'invert_x': False,
        'invert_y': False,
        'tiles': {}
    }
    for default in img_defaults:
        if default not in img_info:
            if default in file_info:
                img_info[default] = file_info[default]
            else:
                img_info[default] = img_defaults[default]
    
    #print('img_info:', img_info)
    return img_info

def get_tile_filename(file_info, img_info, x0_idx, xf_idx, y0_idx, yf_idx):
    filename_params = [file_info['filename'], file_info['frame'],
        x0_idx, xf_idx, y0_idx, yf_idx, 
        "{0:.3f}".format(img_info['scale']), img_info['colormap']['name'], 
        "{0:.2f}".format(img_info['colormap']['px_min']),
        "{0:.2f}".format(img_info['colormap']['px_max']), 
        str(img_info['colormap']['invert_color'])]
    new_filename = '_'.join([str(f) for f in filename_params])
    new_filepath = os.path.join(img_info['save_path'], new_filename+'.'+file_info['tile_format'])
    return new_filepath

def get_tile_info(file_info, img_info):
    """
    Get info for all tiles available in the viewer. If the tile has not been loaded yet,
    it is added to the new_tiles array.
    """
    all_tiles = []
    new_tiles = {}
    if img_info['invert_x']:
        xmin = img_info['width']*img_info['scale'] - img_info['viewer']['right']
        xmax = img_info['width']*img_info['scale'] - img_info['viewer']['left']
    else:
        xmin = img_info['viewer']['left']
        xmax = img_info['viewer']['right']
    if img_info['invert_y']:
        ymin = img_info['height']*img_info['scale'] - img_info['viewer']['bottom']
        ymax = img_info['height']*img_info['scale'] - img_info['viewer']['top']
    else:
        ymin = img_info['viewer']['top']
        ymax = img_info['viewer']['bottom']
    minCol = int(max(1,math.floor(xmin/file_info['tile_width'])))-1
    maxCol=int(min(img_info['columns'],math.ceil(xmax/file_info['tile_width'])))
    minRow = int(max(1,math.floor(ymin/file_info['tile_height'])))-1
    maxRow = int(min(img_info['rows'],math.ceil(ymax/file_info['tile_height'])))
    
    block_width = int(math.ceil(file_info['tile_width']/img_info['scale']))
    block_height = int(math.ceil(file_info['tile_height']/img_info['scale']))
    
    for row in range(minRow,maxRow):
        y0 = row*file_info['tile_height']
        yf = (row+1)*file_info['tile_height']
        y0_idx = int(y0/img_info['scale'])
        yf_idx = min(y0_idx + block_height, img_info['height'])
        for col in range(minCol,maxCol):
            all_tiles.append(str(col)+','+str(row))
            tile_idx = str(col)+','+str(row)
            if (tile_idx not in img_info['tiles'] or 
                    'loaded' not in img_info['tiles'][tile_idx] or
                    not img_info['tiles'][tile_idx]['loaded']):
                x0 = col*file_info['tile_width']
                xf = (col+1)*file_info['tile_width']
                x0_idx = int(x0/img_info['scale'])
                xf_idx = min(x0_idx+block_width, img_info['width'])
                tile_width = int((xf_idx-x0_idx)*img_info['scale'])
                tile_height = int((yf_idx-y0_idx)*img_info['scale'])
                new_filepath = get_tile_filename(
                    file_info, img_info, x0_idx, xf_idx, y0_idx, yf_idx)
                tile = {
                    'idx': tile_idx,
                    'left': x0,
                    'right': xf,
                    'top': y0,
                    'bottom': yf,
                    'y0_idx': y0_idx,
                    'yf_idx': yf_idx,
                    'x0_idx': x0_idx,
                    'xf_idx': xf_idx,
                    'new_filepath': new_filepath,
                    'loaded': False,
                    'row': row,
                    'col': col,
                    'x': col*file_info['tile_width'],
                    'y': row*file_info['tile_height'],
                    'width': tile_width,
                    'height': tile_height
                }
                if img_info['invert_y']:
                    tile['top'] = yf
                    tile['bottom'] = y0
                if img_info['invert_x']:
                    tile['left'] = xf
                    tile['right'] = x0
                new_tiles[tile_idx] = tile
    print('viewer:', img_info['viewer'])
    print('new tiles', new_tiles.keys())
    return all_tiles, new_tiles

def scale_data(file_info, img_info, tile_info, data):
    if img_info['scale']==1:
        data = data[tile_info['y0_idx']:tile_info['yf_idx'],
            tile_info['x0_idx']:tile_info['xf_idx']]
    else:
        try:
            import scipy.ndimage
            data = data[tile_info['y0_idx']:tile_info['yf_idx'],
                tile_info['x0_idx']:tile_info['xf_idx']]
            data = scipy.ndimage.zoom(data, img_info['scale'], order=0)
        except ImportError:
            if img_info['scale']>1:
                data = data[tile_info['y0_idx']:tile_info['yf_idx'],
                    tile_info['x0_idx']:tile_info['xf_idx']]
                data = np.kron(data, np.ones((img_info['scale'],img_info['scale'])))
                #data = zoom(data, img_info['scale'], order=0)
            elif img_info['scale']<1 and img_info['scale']>0:
                tile_width = min(file_info['tile_width'],
                    int((img_info['width']-tile_info['x0_idx'])*img_info['scale'])-1)
                tile_height = min(file_info['tile_height'],
                    int((img_info['height']-tile_info['y0_idx'])*img_info['scale'])-1)
        
                xmax = min(img_info['width']-1, tile_info['xf_idx'])
                ymax = min(img_info['height']-1, tile_info['yf_idx'])
        
                xIdx=np.linspace(tile_info['x0_idx'], xmax, tile_width)
                yIdx=np.linspace(tile_info['y0_idx'], ymax, tile_height)
                xIdx=np.array(xIdx,np.int)
                yIdx=np.reshape(np.array(yIdx,np.int),(yIdx.size,1))
                data = data[yIdx,xIdx]
            else:
                raise ToyzJobError('Scale must be a positive number')
    return data

def create_tile(file_info, img_info, tile_info):
    try:
        from PIL import Image
    except ImportError:
        raise ToyzJobError(
            "You must have PIL (Python Imaging Library) installed to "
            "open files of this type"
        )
    
    if file_info['ext'].lower() == 'fits' or file_info['ext'].lower() == 'fits.fz':
        try:
            from matplotlib import cm as cmap
            from matplotlib.colors import Normalize, LinearSegmentedColormap
        except ImportError:
            raise ToyzJobError("You must have matplotlib installed to load FITS images")
        
        hdulist = get_file(file_info)
        data = hdulist[int(img_info['frame'])].data
        # If no advanced resampling algorithm is used, scale the data as quickly as possible.
        # Otherwise crop the data.
        if file_info['resampling'] == 'NEAREST':
            data = scale_data(file_info, img_info, tile_info, data)
        else:
            data = data[
                tile_info['y0_idx']:tile_info['yf_idx'],
                tile_info['x0_idx']:tile_info['xf_idx']]
        # FITS images have a flipped y-axis from what browsers and other image formats expect
        if img_info['invert_y']:
            data = np.flipud(data)
        if img_info['invert_x']:
            data = np.fliplr(data)
        
        norm = Normalize(img_info['colormap']['px_min'], img_info['colormap']['px_max'], True)
        colormap_name = img_info['colormap']['name']
        if img_info['colormap']['invert_color']:
            colormap_name = colormap_name + '_r'
        colormap = getattr(cmap, colormap_name)
        cm = cmap.ScalarMappable(norm, colormap)
        img = np.uint8(cm.to_rgba(data)*255)
        img = Image.fromarray(img)
        if file_info['resampling'] != 'NEAREST':
            img = img.resize(
                (tile_info['width'], tile_info['height']), 
                getattr(Image, file_info['resampling']))
    else:
        img = get_file(file_info)
        img = img.crop((
            tile_info['x0_idx'], tile_info['y0_idx'], 
            tile_info['xf_idx'], 
            tile_info['yf_idx']))
        img = img.resize(
            (tile_info['width'], tile_info['height']), getattr(Image, file_info['resampling']))
    width, height = img.size
    if width>0 and height>0:
        path = os.path.dirname(tile_info['new_filepath'])
        core.create_paths([path])
        img.save(tile_info['new_filepath'], format=img_formats[file_info['tile_format']])
    else:
        return False, ''
    return True, tile_info

def get_img_data(data_type, file_info, img_info, **kwargs):
    """
    Get data from an image or FITS file
    """
    if file_info['ext'].lower() == 'fits' or file_info['ext'].lower() == 'fits.fz':
        hdulist = get_file(file_info)
        data = hdulist[int(img_info['frame'])].data
    else:
        try:
            from PIL import Image
        except ImportError:
            raise ToyzJobError(
                "You must have PIL (Python Imaging Library) installed to "
                "open files of this type"
            )
        img = get_file(file_info)
        data = np.array(img)
    
    if data_type == 'data':
        if 'scale' in kwargs:
            width = int(kwargs['width']/2/img_info['viewer']['scale'])
            height = int(kwargs['height']/2/img_info['viewer']['scale'])
        else:
            width = int(kwargs['width']/2)
            height = int(kwargs['height']/2)
        x0 = max(0, kwargs['x']-width)
        y0 = max(0, kwargs['y']-height)
        xf = min(data.shape[1], kwargs['x']+width)
        yf = min(data.shape[0], kwargs['y']+height)
        if 'scale' in kwargs:
            tile_data = {
                'x0_idx': x0,
                'y0_idx': y0,
                'xf_idx': xf,
                'yf_idx': yf
            }
            data = scale_data(file_info, img_info, tile_data, data)
        else:
            data = data[y0:yf, x0:xf]
        response = {
            'id': 'data',
            'min': float(data.min()),
            'max': float(data.max()),
            'mean': float(data.mean()),
            'median': float(np.median(data)),
            'std_dev': float(np.std(data)),
            'data': data.tolist()
        }
    elif data_type == 'datapoint':
        if (kwargs['x']<data.shape[1] and kwargs['y']<data.shape[0] and
                kwargs['x']>=0 and kwargs['y']>=0):
            response = {
                'id': 'datapoint',
                'px_value': float(data[kwargs['y'],kwargs['x']])
            }
        else:
            response = {
                'id': 'datapoint',
                'px_value': 0
            }
    else:
        raise ToyzJobError("Loading that data type has not been implemented yet")
    return response
            