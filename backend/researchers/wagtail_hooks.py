from wagtail import hooks
from wagtail.admin.rich_text.converters.html_to_contentstate import InlineStyleElementHandler
from wagtail.admin.rich_text.editors.draftail.features import InlineStyleFeature


@hooks.register("register_rich_text_features")
def register_underline_feature(features):
    feature_name = "underline"
    type_ = "UNDERLINE"

    control = {
        "type": type_,
        "label": "U",
        "description": "Underline",
    }

    features.register_editor_plugin(
        "draftail",
        feature_name,
        InlineStyleFeature(control),
    )

    features.register_converter_rule(
        "contentstate",
        feature_name,
        {
            "from_database_format": {"u": InlineStyleElementHandler(type_)},
            "to_database_format": {"style_map": {type_: "u"}},
        },
    )

    if feature_name not in features.default_features:
        features.default_features.append(feature_name)