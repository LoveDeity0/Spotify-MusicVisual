import pandas as pd
from flask import Flask, render_template, jsonify, send_from_directory
import os
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/genre')
def genre():
    return render_template('genre.html')

@app.route("/data")
def data():
    with open("./data/genre_stats.json", "r", encoding="utf-8") as f:
        return jsonify(json.load(f))

@app.route("/era-genre-data")
def era_genre_data():
    with open("./data/final_era_genre_table.json", "r", encoding="utf-8") as f:
        return jsonify(json.load(f))

@app.route("/new-genres-data")
def new_genres_data():
    with open("./data/new_genres.json", "r", encoding="utf-8") as f:
        return jsonify(json.load(f))

@app.route("/popular_songs")
def popular_songs():
    with open("./data/popular_songs.json", "r", encoding="utf-8") as f:
        return jsonify(json.load(f))

@app.route("/genre-data")
def genre_data():
    with open('./data/genre_stats.json') as f:
        return f.read(), 200, {'Content-Type': 'application/json'}

@app.route('/context-data')
def context_data():
    df = pd.read_csv('./data/genre_context.csv')
    return df.to_csv(index=False), 200, {'Content-Type': 'text/csv'}

@app.route('/decade/<era>')
def decade_page(era):
    valid_eras = ['60s', '70s', '80s', '90s', '00s', '10s', '20s']
    if era in valid_eras:
        return render_template(f'{era}.html')
    else:
        return "Invalid era", 404

@app.route('/arc-data')
def arc_data():
    json_path = './data/explicit_by_decade.json'
    if not os.path.exists(json_path):
        return jsonify({"error": "数据文件不存在"}), 404
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/boxplot-data')
def boxplot_data():
    json_path = './data/audio_features_boxplot_2010s.json'
    if not os.path.exists(json_path):
        return jsonify({"error": "数据文件不存在"}), 404

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/sankey-data')
def sankey_data():
    json_path = './data/sankey_data_2010s.json'
    if not os.path.exists(json_path):
        return jsonify({"error": "数据文件不存在"}), 404
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/matrix-data')
def matrix_data():
    json_path = './data/audio_features_correlation_matrix_2010s.json'
    if not os.path.exists(json_path):
        return jsonify({"error": "数据文件不存在"}), 404
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)), debug=True)
