import sys
import json
import pandas as pd
import joblib
import os

print(">>> Python script dimulai", flush=True)

try:
    input_data = json.loads(sys.argv[1])

    # Mapping untuk input
    gender_map = {'Laki-laki': 0, 'Perempuan': 1}
    yes_no_map = {'Ya': 1, 'Tidak': 0}
    level_map = {
        'Sangat Rendah': 1,
        'Rendah': 2,
        'Sedang': 3,
        'Tinggi': 4,
        'Sangat Tinggi': 5
    }

    # Pastikan urutan fitur sesuai dengan training
    processed_input = {
        'Gender': gender_map[input_data['Gender']],
        'Minat_Teknologi': yes_no_map[input_data['Minat_Teknologi']],
        'Minat_Seni': yes_no_map[input_data['Minat_Seni']],
        'Minat_Bisnis': yes_no_map[input_data['Minat_Bisnis']],
        'Minat_Hukum': yes_no_map[input_data['Minat_Hukum']],
        'Minat_Kesehatan': yes_no_map[input_data['Minat_Kesehatan']],
        'Minat_Sains': yes_no_map[input_data['Minat_Sains']],
        'Problem_Solving': level_map[input_data['Problem_Solving']],
        'Kreativitas': level_map[input_data['Kreativitas']],
        'Kepemimpinan': level_map[input_data['Kepemimpinan']],
        'Kerja_Tim': level_map[input_data['Kerja_Tim']],
        'nilai akhir SMA/SMK': float(input_data['nilai akhir SMA/SMK'])
    }

    # Tambahkan fitur turunan
    processed_input['Total_Minat'] = (
        processed_input['Minat_Teknologi'] +
        processed_input['Minat_Seni'] +
        processed_input['Minat_Bisnis'] +
        processed_input['Minat_Hukum'] +
        processed_input['Minat_Kesehatan'] +
        processed_input['Minat_Sains']
    )

    processed_input['Total_Softskill'] = (
        processed_input['Problem_Solving'] +
        processed_input['Kreativitas'] +
        processed_input['Kepemimpinan'] +
        processed_input['Kerja_Tim']
    )

    print(">>> Data siap:", processed_input, flush=True)

    input_df = pd.DataFrame([processed_input])
    print(">>> DataFrame columns:", input_df.columns.tolist(), flush=True)
    print(">>> DataFrame shape:", input_df.shape, flush=True)
    print(">>> DataFrame values:", input_df.values[0], flush=True)

    model_path = os.path.join(os.path.dirname(__file__), '../model/decision_tree_model_optimized.pkl')
    print(">>> Memuat model dari:", model_path, flush=True)
    model = joblib.load(model_path)

    # Debug: Print expected features by model
    if hasattr(model, 'feature_names_in_'):
        print(">>> Expected features by model:", model.feature_names_in_.tolist(), flush=True)
    
    # Reorder columns to match model expectations
    expected_features = ['Gender', 'Minat_Teknologi', 'Minat_Seni', 'Minat_Bisnis', 'Minat_Hukum', 'Minat_Kesehatan', 'Minat_Sains', 'Problem_Solving', 'Kreativitas', 'Kepemimpinan', 'Kerja_Tim', 'Total_Minat', 'Total_Softskill', 'nilai akhir SMA/SMK']
    input_df = input_df[expected_features]
    print(">>> Final DataFrame columns:", input_df.columns.tolist(), flush=True)

    print(">>> Mulai prediksi...", flush=True)
    prediction = model.predict(input_df)
    print(">>> Primary prediction:", prediction[0], flush=True)

    # Ambil top-3 prediksi berdasarkan probabilitas
    proba = model.predict_proba(input_df)[0]
    print(">>> All probabilities:", proba, flush=True)
    print(">>> Classes:", model.classes_, flush=True)
    
    top3_idx = proba.argsort()[-3:][::-1]
    top3_labels = [model.classes_[i] for i in top3_idx]
    top3_scores = [round(proba[i], 4) for i in top3_idx]

    # Format output untuk JavaScript
    result = {
        "prediction": prediction[0],
        "top3": list(zip(top3_labels, top3_scores))
    }

    # Print final result yang akan di-parse oleh JavaScript
    print(">>> Final result:", json.dumps(result), flush=True)

except Exception as e:
    print(">>> ERROR:", str(e), flush=True)
    sys.exit(1)