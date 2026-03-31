import json
from typing import Any

from geoalchemy2.elements import WKTElement
from geoalchemy2.shape import to_shape
from shapely.geometry import shape
from shapely.geometry.base import BaseGeometry
from shapely.ops import unary_union
from shapely.wkt import dumps as wkt_dumps


def geojson_dict_to_geom(geojson_obj: dict[str, Any], srid: int = 4326) -> WKTElement:
    geom = shape(geojson_obj)
    return WKTElement(wkt_dumps(geom), srid=srid)


def geom_to_geojson(geom_value: Any) -> dict[str, Any] | None:
    if geom_value is None:
        return None
    geom = to_shape(geom_value)
    return json.loads(json.dumps(geom.__geo_interface__))


def polygon_center_point(geojson_polygon: dict[str, Any]) -> WKTElement:
    poly: BaseGeometry = shape(geojson_polygon)
    center = poly.centroid
    return WKTElement(wkt_dumps(center), srid=4326)


def feature_collection(features: list[dict[str, Any]]) -> dict[str, Any]:
    return {"type": "FeatureCollection", "features": features}


def polygon_feature(permit: dict[str, Any], polygon_geojson: dict[str, Any]) -> dict[str, Any]:
    return {
        "type": "Feature",
        "geometry": polygon_geojson,
        "properties": {k: v for k, v in permit.items() if k != "trench_polygon"},
    }


def union_geojson(polygons: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not polygons:
        return None
    merged = unary_union([shape(p) for p in polygons])
    return json.loads(json.dumps(merged.__geo_interface__))

